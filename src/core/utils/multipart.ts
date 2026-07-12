import type { MultipartFileType, MultipartFilesType } from './schema';

/**
 * Unwrap a multipart text field (`attachFieldsToBody: true` shape).
 */
export function multipartValue<T>(
  field: { value: T } | undefined,
): T | undefined {
  return field?.value;
}

/**
 * Normalize one-or-many file parts from `attachFieldsToBody: true`.
 */
export function normalizeMultipartFiles(
  field: MultipartFilesType | undefined,
): MultipartFileType[] {
  if (!field) return [];
  return Array.isArray(field) ? field : [field];
}
