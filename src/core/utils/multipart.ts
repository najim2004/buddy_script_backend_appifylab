import { FastifyRequest } from 'fastify';
import type { MultipartFileType } from './schema';

type MultipartFieldPart = {
  type: 'field';
  value: unknown;
};

type MultipartBody = Record<string, unknown>;

function isFieldPart(value: unknown): value is MultipartFieldPart {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as MultipartFieldPart).type === 'field' &&
    'value' in (value as object)
  );
}

function isFilePart(value: unknown): value is MultipartFileType {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value as { type?: string }).type === 'file' &&
    typeof (value as MultipartFileType).toBuffer === 'function'
  );
}

/**
 * Flatten `attachFieldsToBody: true` text parts to plain values so route
 * schemas (and Swagger) can use normal Type.String / enums.
 *
 * For file fields:
 * - normalizes a single file part into a one-element array
 * - drops empty / filename-less parts (Swagger often sends these)
 * - removes the key entirely when nothing usable remains (keeps field optional)
 */
export function flattenMultipartBody(
  request: FastifyRequest,
  fileFields: string[] = [],
): void {
  if (!request.isMultipart()) return;

  const body = request.body as MultipartBody | null | undefined;
  if (!body || typeof body !== 'object') return;

  for (const [key, value] of Object.entries(body)) {
    if (isFieldPart(value)) {
      body[key] = value.value;
    }
  }

  for (const field of fileFields) {
    const value = body[field];
    if (value === undefined || value === null) {
      delete body[field];
      continue;
    }

    const parts = isFilePart(value)
      ? [value]
      : Array.isArray(value)
        ? value.filter(isFilePart)
        : [];

    const usable = parts.filter((part) => Boolean(part.filename?.trim()));

    if (usable.length === 0) {
      delete body[field];
    } else {
      body[field] = usable;
    }
  }
}

export function normalizeMultipartFiles(
  field: MultipartFileType[] | MultipartFileType | undefined,
): MultipartFileType[] {
  if (!field) return [];
  return Array.isArray(field) ? field : [field];
}
