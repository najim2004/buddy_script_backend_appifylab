import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createHmac, timingSafeEqual } from 'crypto';
import { Type, Static } from '@sinclair/typebox';
import { Readable } from 'stream';
import path from 'path';
import { SWAGGER_TAGS } from '../../docs/swagger';
import Storage from '../../infrastructure/storage/storage';
import env from '../../app/env';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

// ---------------------------------------------------------------------------
// Query-string schema — validated natively by Fastify TypeBox TypeProvider
// ---------------------------------------------------------------------------

const serveQuerySchema = Type.Object({
  /** Storage key, e.g. "avatars/user-1.jpg" */
  key: Type.String({ minLength: 1, description: 'Storage key' }),
  /** UNIX timestamp (seconds) after which the URL is no longer valid */
  exp: Type.Optional(
    Type.Number({ description: 'Expiry timestamp (UNIX seconds)' }),
  ),
  /** HMAC-SHA256 signature */
  sig: Type.String({
    minLength: 64,
    maxLength: 64,
    description: 'HMAC-SHA256 signature (64 hex chars)',
  }),
  /** "1" → force Content-Disposition: attachment */
  dl: Type.Optional(Type.Literal('1', { description: 'Force download' })),
});

type ServeQuery = Static<typeof serveQuerySchema>;

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
  // 1. Fastify TypeProvider natively validates the query params before reaching here.
  const { key, exp, sig, dl } = request.query;

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

export const storageServeRoute = async (
  fastify: FastifyInstance,
): Promise<void> => {
  const typedFastify = fastify.withTypeProvider<TypeBoxTypeProvider>();

  typedFastify.get(
    '/serve',
    {
      schema: {
        tags: [SWAGGER_TAGS.FILES],
        summary: 'Serve a signed storage file',
        description:
          'Streams a file from the configured storage backend. ' +
          'The URL must be generated by `Storage.signedUrl()` and carries ' +
          'an HMAC signature that is verified on every request.',
        querystring: serveQuerySchema,
        response: {
          200: { description: 'File content stream', type: 'object' },
          400: { description: 'Invalid URL parameters', type: 'object' },
          403: { description: 'Invalid or tampered signature', type: 'object' },
          404: { description: 'File not found', type: 'object' },
          410: { description: 'URL has expired', type: 'object' },
        },
      },
    },
    serveFile,
  );
};

export default storageServeRoute;
