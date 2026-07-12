import { Type, Static } from '@sinclair/typebox';
import { PostType, PostVisibility } from '../../../prisma/generated/enums';
import { MultipartFile, StringEnum } from '../../core/utils/schema';

export const CreatePostDto = Type.Object({
  content: Type.Optional(Type.String()),
  visibility: Type.Optional(StringEnum(PostVisibility)),
  post_type: Type.Optional(StringEnum(PostType)),
});

export type CreatePostDtoType = Static<typeof CreatePostDto>;

/**
 * Multipart create-post body (Swagger-friendly flat fields).
 *
 * Requires:
 * - `attachFieldsToBody: true` + `ajvFilePlugin`
 * - `flattenMultipartBody` in `preValidation` (unwraps `{ value }` text parts
 *   and normalizes a single file into an array)
 */
export const CreatePostMultipartDto = Type.Object({
  content: Type.Optional(Type.String()),
  visibility: Type.Optional(StringEnum(PostVisibility)),
  post_type: Type.Optional(StringEnum(PostType)),
  attachments: Type.Optional(
    Type.Array(MultipartFile, {
      minItems: 0,
      description: 'Optional. One or more files (same field name: attachments).',
    }),
  ),
});

export type CreatePostMultipartDtoType = Static<typeof CreatePostMultipartDto>;

export const UpdatePostDto = Type.Object({
  content: Type.Optional(Type.String()),
  post_type: Type.Optional(StringEnum(PostType)),
});

export type UpdatePostDtoType = Static<typeof UpdatePostDto>;

export const UpdateVisibilityDto = Type.Object({
  visibility: StringEnum(PostVisibility),
});

export type UpdateVisibilityDtoType = Static<typeof UpdateVisibilityDto>;

export const CreateCommentDto = Type.Object({
  content: Type.String({ minLength: 1 }),
  parent_id: Type.Optional(Type.String()),
  reply_to_user_id: Type.Optional(Type.String()),
});

export type CreateCommentDtoType = Static<typeof CreateCommentDto>;

export const CursorPaginationQuery = Type.Object({
  cursor: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Number({ default: 10, minimum: 1, maximum: 100 })),
});

export type CursorPaginationQueryType = Static<typeof CursorPaginationQuery>;

export const ParamsWithId = Type.Object({
  id: Type.String(),
});

export type ParamsWithIdType = Static<typeof ParamsWithId>;
