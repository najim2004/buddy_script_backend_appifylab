import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createHmac, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { Readable } from 'stream';
import path from 'path';
import { SWAGGER_TAGS } from '../../docs/swagger';
import Storage from '../../infrastructure/storage/storage';
import env from '../../app/env';

// ---------------------------------------------------------------------------
// Query-string schema — validated with Zod before touching the signature
// ---------------------------------------------------------------------------

const serveQuerySchema = z.object({
  /** Storage key, e.g. "avatars/user-1.jpg" */
  key: z.string().min(1),
  /** UNIX timestamp (seconds) after which the URL is no longer valid */
  exp: z.coerce.number().int().positive().optional(),
  /** HMAC-SHA256 signature */
  sig: z.string().length(64),
  /** "1" → force Content-Disposition: attachment */
  dl: z.enum(['1']).optional(),
});

type ServeQuery = z.infer<typeof serveQuerySchema>;

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

/**
 * Recompute the HMAC for `key:exp` and compare it to the supplied signature
 * using a constant-time comparison to prevent timing attacks.
 */
function verifySignature(
  key: string,
  exp: number | undefined,
  sig: string,
): boolean {
  const payload = `${key}:${exp ?? ''}`;
  const expected = createHmac('sha256', env.APP_KEY)
    .update(payload)
    .digest('hex');

  // timingSafeEqual requires equal-length Buffers
  try {
    return timingSafeEqual(
      Buffer.from(sig, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    // Buffers of different length (malformed sig) → always invalid
    return false;
  }
}

// ---------------------------------------------------------------------------
// Mime-type helper
// ---------------------------------------------------------------------------

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  csv: 'text/csv',
  txt: 'text/plain',
  json: 'application/json',
  zip: 'application/zip',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  webm: 'video/webm',
};

function mimeFromKey(key: string): string {
  const ext = path.extname(key).slice(1).toLowerCase();
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

async function serveFile(
  request: FastifyRequest<{ Querystring: ServeQuery }>,
  reply: FastifyReply,
): Promise<void> {
  // 1. Parse & validate query params
  const parseResult = serveQuerySchema.safeParse(request.query);
  if (!parseResult.success) {
    return reply.badRequest('Invalid file URL parameters');
  }

  const { key, exp, sig, dl } = parseResult.data;

  // 2. Verify HMAC signature — prevents accessing arbitrary keys
  if (!verifySignature(key, exp, sig)) {
    return reply.forbidden('Invalid or tampered file URL');
  }

  // 3. Check expiry (if the URL was generated with expiresIn)
  if (exp !== undefined && Math.floor(Date.now() / 1000) > exp) {
    return reply.gone('File URL has expired');
  }

  // 4. Fetch the file from the configured storage driver
  const file = await Storage.get(key);
  if (file === null) {
    return reply.notFound('File not found');
  }

  // 5. Set response headers
  const contentType = mimeFromKey(key);
  reply.header('Content-Type', contentType);
  reply.header(
    'Cache-Control',
    exp ? 'private, no-store' : 'private, max-age=86400',
  );

  if (dl === '1') {
    reply.header(
      'Content-Disposition',
      `attachment; filename="${path.basename(key)}"`,
    );
  } else {
    reply.header('Content-Disposition', 'inline');
  }

  // 6. Stream or send the file
  if (file instanceof Readable) {
    return reply.send(file);
  }

  // LocalAdapter returns a Buffer
  return reply.send(file);
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

/**
 * GET /api/files/serve
 *
 * Serves a storage file identified by a signed (HMAC-protected) URL.
 *
 * Query parameters (all generated automatically by `Storage.signedUrl()`):
 *   key  — storage key of the file
 *   sig  — HMAC-SHA256(APP_KEY, `${key}:${exp ?? ''}`)  — 64 hex chars
 *   exp  — optional UNIX expiry timestamp (seconds)
 *   dl   — optional "1" to force browser download
 *
 * Security guarantees:
 *   • The HMAC signature is tied to the exact `key` value — swapping the key
 *     breaks the signature, preventing access to other files.
 *   • Constant-time comparison prevents timing-based signature attacks.
 *   • Expired URLs are rejected with HTTP 410 Gone.
 *   • No auth token is required — the signed URL itself is the credential.
 *     This makes it safe to embed in emails, PDFs, or other contexts where
 *     a bearer token is unavailable.
 */
export const storageServeRoute = async (
  fastify: FastifyInstance,
): Promise<void> => {
  fastify.get<{ Querystring: ServeQuery }>(
    '/serve',
    {
      schema: {
        tags: [SWAGGER_TAGS.FILES],
        summary: 'Serve a signed storage file',
        description:
          'Streams a file from the configured storage backend. ' +
          'The URL must be generated by `Storage.signedUrl()` and carries ' +
          'an HMAC signature that is verified on every request.',
        querystring: {
          type: 'object',
          required: ['key', 'sig'],
          properties: {
            key: { type: 'string', description: 'Storage key' },
            sig: {
              type: 'string',
              description: 'HMAC-SHA256 signature (64 hex chars)',
            },
            exp: {
              type: 'number',
              description: 'Expiry timestamp (UNIX seconds)',
            },
            dl: { type: 'string', enum: ['1'], description: 'Force download' },
          },
        },
        response: {
          200: { description: 'File content stream' },
          400: { description: 'Invalid URL parameters' },
          403: { description: 'Invalid or tampered signature' },
          404: { description: 'File not found' },
          410: { description: 'URL has expired' },
        },
      },
    },
    serveFile,
  );
};

export default storageServeRoute;
