import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  GetObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHmac } from 'crypto';
import { Readable } from 'stream';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import env from '../../app/env';
import logger from '../../app/logger';

// ---------------------------------------------------------------------------
// UrlOptions — controls how a URL is generated
// ---------------------------------------------------------------------------

export interface UrlOptions {
  /**
   * Generate an expiring URL.
   * - S3 driver   → AWS presigned URL (native, no proxy needed)
   * - local driver → HMAC-signed proxy URL with expiry embedded
   * Value is in **seconds**.
   * @example 15 * 60  // 15 minutes
   */
  expiresIn?: number;

  /**
   * Generate an HMAC-signed URL tied to this exact key.
   * The URL never expires, but the signature is key-specific —
   * substituting a different key will break the signature.
   * Ideal for email links, shareable permalinks, etc.
   *
   * Both `signed` and `expiresIn` can be combined:
   * the resulting URL will be signed AND expiring.
   */
  signed?: boolean;

  /**
   * Force the browser to download the file instead of opening it.
   * Adds `response-content-disposition=attachment` to the URL.
   */
  download?: boolean;
}

// ---------------------------------------------------------------------------
// IStorage — common contract for all storage adapters
// ---------------------------------------------------------------------------

export interface IStorage {
  /** Generate a direct (public) URL for the given key. Sync. */
  url(key: string): string;

  /**
   * Generate a signed or presigned URL.
   * - No options  → behaves like `url()` but async
   * - expiresIn   → expiring URL
   * - signed      → HMAC key-locked URL (no expiry unless expiresIn also set)
   * - download    → forces browser download
   */
  signedUrl(key: string, options?: UrlOptions): Promise<string>;

  /** Check whether an object exists */
  exists(key: string): Promise<boolean>;

  /** Retrieve an object — returns a stream (S3) or Buffer (local) */
  get(key: string): Promise<Readable | Buffer | null>;

  /** Store a file at the given key */
  put(key: string, value: Buffer | string, mimeType?: string): Promise<void>;

  /** Delete a file at the given key */
  delete(key: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Shared helper — HMAC signature for proxy URLs (local + signed-S3-proxy)
// ---------------------------------------------------------------------------

function buildProxyUrl(
  key: string,
  options: UrlOptions & { expiresAt?: number },
): string {
  const params = new URLSearchParams({ key });

  if (options.download) params.set('dl', '1');

  if (options.expiresAt) {
    params.set('exp', String(options.expiresAt));
  }

  // HMAC covers key + expiry so neither can be tampered independently
  const payload = `${key}:${options.expiresAt ?? ''}`;
  const sig = createHmac('sha256', env.APP_KEY).update(payload).digest('hex');
  params.set('sig', sig);

  return `${env.APP_URL}/api/files/serve?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// S3Adapter — works with AWS S3 and any S3-compatible service (MinIO, etc.)
// ---------------------------------------------------------------------------

export class S3Adapter implements IStorage {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = env.AWS_BUCKET ?? 'default-bucket';
    this.s3 = new S3Client({
      endpoint: env.AWS_ENDPOINT || undefined,
      region: env.AWS_DEFAULT_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? '',
      },
      // Required for MinIO and local S3-compatible services
      forcePathStyle: Boolean(env.AWS_ENDPOINT),
    });
  }

  /**
   * Typed wrapper that isolates the one unavoidable cross-package cast.
   * `@aws-sdk/s3-request-presigner` ships its own internal `Client` generic
   * that is structurally identical to `S3Client` but not assignment-compatible.
   * Casting through `unknown` is the narrowest possible escape hatch — it is
   * confined here so the rest of the codebase stays fully typed.
   */
  private async getPresignedUrl(
    input: GetObjectCommandInput,
    options: { expiresIn: number },
  ): Promise<string> {
    const command = new GetObjectCommand(input);
    return getS3SignedUrl(
      this.s3 as unknown as Parameters<typeof getS3SignedUrl>[0],
      command as Parameters<typeof getS3SignedUrl>[1],
      options,
    );
  }

  url(key: string): string {
    if (env.AWS_ENDPOINT) {
      return `${env.AWS_ENDPOINT}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${env.AWS_DEFAULT_REGION ?? 'us-east-1'}.amazonaws.com/${key}`;
  }

  async signedUrl(key: string, options: UrlOptions = {}): Promise<string> {
    const { expiresIn, signed, download } = options;

    // signed=true (no expiry) — use HMAC proxy URL so key is locked
    if (signed && !expiresIn) {
      return buildProxyUrl(key, { signed, download });
    }

    // expiresIn → native AWS presigned URL (most efficient for S3)
    if (expiresIn) {
      const presigned = await this.getPresignedUrl(
        {
          Bucket: this.bucket,
          Key: key,
          ...(download && {
            ResponseContentDisposition: `attachment; filename="${path.basename(key)}"`,
          }),
        },
        { expiresIn },
      );

      // If also signed, wrap in proxy instead of exposing raw presigned URL
      if (signed) {
        return buildProxyUrl(key, {
          expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
          download,
        });
      }

      return presigned;
    }

    // No options → direct URL
    return this.url(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<Readable | null> {
    try {
      const response = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return (response.Body as Readable) ?? null;
    } catch (err) {
      logger.error({ err, key }, 'S3: Failed to get object');
      return null;
    }
  }

  async put(
    key: string,
    value: Buffer | string,
    mimeType?: string,
  ): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: value,
        ...(mimeType && { ContentType: mimeType }),
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}

// ---------------------------------------------------------------------------
// LocalAdapter — stores files on the local filesystem under public/storage
// ---------------------------------------------------------------------------

export class LocalAdapter implements IStorage {
  private readonly rootPath: string;
  private readonly publicPath: string;

  constructor() {
    this.rootPath = path.join(process.cwd(), 'public', 'storage');
    this.publicPath = '/public/storage';
  }

  url(key: string): string {
    return `${env.APP_URL}${this.publicPath}/${key}`;
  }

  async signedUrl(key: string, options: UrlOptions = {}): Promise<string> {
    const { expiresIn, signed, download } = options;

    // No options → direct URL
    if (!expiresIn && !signed) {
      return this.url(key);
    }

    const expiresAt = expiresIn
      ? Math.floor(Date.now() / 1000) + expiresIn
      : undefined;

    return buildProxyUrl(key, { expiresAt, signed, download });
  }

  async exists(key: string): Promise<boolean> {
    return fsSync.existsSync(path.join(this.rootPath, key));
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(path.join(this.rootPath, key));
    } catch {
      return null;
    }
  }

  async put(key: string, value: Buffer | string): Promise<void> {
    const filePath = path.join(this.rootPath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, value);
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(path.join(this.rootPath, key));
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      // Silently ignore "file not found" — treat it as a no-op
      if (error.code !== 'ENOENT') {
        logger.error({ err, key }, 'Local: Failed to delete file');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Storage facade
//
// Two ways to use:
//
//   1. Shorthand (uses STORAGE_DRIVER from .env):
//        Storage.url(key)
//        Storage.put(key, buffer, 'image/jpeg')
//        await Storage.signedUrl(key, { expiresIn: 900 })
//        await Storage.signedUrl(key, { signed: true })
//
//   2. Explicit driver override:
//        Storage.disk('s3').put(key, buffer)
//        Storage.disk('local').url(key)
// ---------------------------------------------------------------------------

export type StorageDriver = 'local' | 's3';

export class Storage {
  // Adapter singletons — avoids re-constructing S3Client on every call
  private static readonly adapters: Partial<Record<StorageDriver, IStorage>> =
    {};

  private static resolveAdapter(driver: StorageDriver): IStorage {
    if (!Storage.adapters[driver]) {
      switch (driver) {
        case 's3':
          Storage.adapters[driver] = new S3Adapter();
          break;
        case 'local':
        default:
          Storage.adapters[driver] = new LocalAdapter();
          break;
      }
    }
    return Storage.adapters[driver]!;
  }

  /**
   * Return the adapter for an explicit driver.
   * Omit `driver` to use the default set via `STORAGE_DRIVER` env.
   */
  static disk(driver?: StorageDriver): IStorage {
    const resolved: StorageDriver =
      driver ?? (env.STORAGE_DRIVER as StorageDriver);
    return Storage.resolveAdapter(resolved);
  }

  // -------------------------------------------------------------------------
  // Shorthand static methods — mirror of SojebStorage in NestJS boilerplate
  // -------------------------------------------------------------------------

  /**
   * Generate a direct public URL for the given key.
   * Uses the default driver (STORAGE_DRIVER env).
   *
   * @example
   *   Storage.url('avatars/user-1.jpg')
   */
  static url(key: string): string {
    return Storage.disk().url(key);
  }

  /**
   * Generate a signed or presigned URL.
   *
   * @example
   *   // Expires in 15 minutes
   *   await Storage.signedUrl('invoices/inv-001.pdf', { expiresIn: 15 * 60 })
   *
   *   // Never expires, but locked to this key (perfect for email links)
   *   await Storage.signedUrl('reports/q1.pdf', { signed: true })
   *
   *   // Expires in 1 hour AND key-locked
   *   await Storage.signedUrl('exports/data.csv', { signed: true, expiresIn: 3600 })
   *
   *   // Force download
   *   await Storage.signedUrl('docs/manual.pdf', { signed: true, download: true })
   */
  static async signedUrl(key: string, options?: UrlOptions): Promise<string> {
    return Storage.disk().signedUrl(key, options);
  }

  /**
   * Store a file at the given key.
   *
   * @example
   *   await Storage.put('avatars/user-1.jpg', buffer, 'image/jpeg')
   */
  static async put(
    key: string,
    value: Buffer | string,
    mimeType?: string,
  ): Promise<void> {
    return Storage.disk().put(key, value, mimeType);
  }

  /**
   * Retrieve a file.
   *
   * @example
   *   const file = await Storage.get('avatars/user-1.jpg')
   */
  static async get(key: string): Promise<Readable | Buffer | null> {
    return Storage.disk().get(key);
  }

  /**
   * Check whether a file exists.
   *
   * @example
   *   if (await Storage.exists('avatars/user-1.jpg')) { ... }
   */
  static async exists(key: string): Promise<boolean> {
    return Storage.disk().exists(key);
  }

  /**
   * Delete a file.
   *
   * @example
   *   await Storage.delete('avatars/old.jpg')
   */
  static async delete(key: string): Promise<void> {
    return Storage.disk().delete(key);
  }
}

export default Storage;
