import { Type, Static } from '@sinclair/typebox';
import { PostType, PostVisibility } from '../../../prisma/generated/enums';
import { MultipartFile, StringEnum, createSuccessResponseSchema } from '../../core/utils/schema';

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

// ---------------------------------------------------------------------------
// Response Schemas
// ---------------------------------------------------------------------------

export const UserWithAvatarSchema = Type.Object({
  id: Type.String(),
  first_name: Type.String(),
  last_name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  avatar: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const PostLikerSchema = Type.Object({
  id: Type.String(),
  avatar: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

export const PostAttachmentSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  file_path: Type.String(),
  file_name: Type.String(),
  mime_type: Type.String(),
  size_bytes: Type.Union([Type.Number(), Type.Null()]),
});

export const CommentWithAuthorSchema = Type.Object({
  id: Type.String(),
  created_at: Type.Unsafe<Date | string>({ type: 'string', format: 'date-time' }),
  post_id: Type.String(),
  content: Type.String(),
  parent_id: Type.Union([Type.String(), Type.Null()]),
  deleted_at: Type.Union([Type.Unsafe<Date | string>({ type: 'string', format: 'date-time' }), Type.Null()]),
  is_deleted: Type.Boolean(),
  likes: Type.Number(),
  replies: Type.Number(),
  has_liked: Type.Boolean(),
  user: UserWithAvatarSchema,
  reply_to_user: Type.Union([UserWithAvatarSchema, Type.Null()]),
});

/** Embedded latest comment matches full comment API responses. */
export const PostLatestCommentSchema = CommentWithAuthorSchema;

export const PostDetailSchema = Type.Object({
  id: Type.String(),
  created_at: Type.Unsafe<Date | string>({ type: 'string', format: 'date-time' }),
  content: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  visibility: StringEnum(PostVisibility),
  status: Type.String(),
  post_type: StringEnum(PostType),
  author: UserWithAvatarSchema,
  attachments: Type.Array(PostAttachmentSchema),
  comments: Type.Number(),
  likes: Type.Number(),
  has_liked: Type.Boolean(),
  recent_likes: Type.Array(PostLikerSchema),
  latest_comment: Type.Union([PostLatestCommentSchema, Type.Null()]),
});

export const CursorPaginationMetaSchema = Type.Object({
  next_cursor: Type.Union([Type.String(), Type.Null()]),
  has_next_page: Type.Boolean(),
});

export const PostDetailResponseDto = createSuccessResponseSchema(PostDetailSchema);

export const PostListResponseDto = Type.Intersect([
  createSuccessResponseSchema(Type.Array(PostDetailSchema)),
  Type.Object({ meta: CursorPaginationMetaSchema }),
]);

export const LikeWithUserSchema = Type.Object({
  id: Type.String(),
  created_at: Type.Unsafe<Date | string>({ type: 'string', format: 'date-time' }),
  user_id: Type.String(),
  post_id: Type.Union([Type.String(), Type.Null()]),
  comment_id: Type.Union([Type.String(), Type.Null()]),
  user: UserWithAvatarSchema,
});

export const LikeListResponseDto = Type.Intersect([
  createSuccessResponseSchema(Type.Array(LikeWithUserSchema)),
  Type.Object({ meta: CursorPaginationMetaSchema }),
]);

export const CommentResponseDto = createSuccessResponseSchema(CommentWithAuthorSchema);

export const CommentListResponseDto = Type.Intersect([
  createSuccessResponseSchema(Type.Array(CommentWithAuthorSchema)),
  Type.Object({ meta: CursorPaginationMetaSchema }),
]);

export const DeletedCommentResponseDto = createSuccessResponseSchema(
  Type.Object({
    id: Type.String(),
    soft_deleted: Type.Boolean(),
    deleted_at: Type.Union([Type.Unsafe<Date | string>({ type: 'string', format: 'date-time' }), Type.Null()]),
  })
);

export const LikeToggleResponseDto = createSuccessResponseSchema(
  Type.Object({
    liked: Type.Boolean(),
  })
);

export const PostVisibilityUpdateResponseDto = createSuccessResponseSchema(
  Type.Object({
    id: Type.String(),
    visibility: StringEnum(PostVisibility),
    updated_at: Type.Unsafe<Date | string>({ type: 'string', format: 'date-time' }),
  })
);

export const BasicSuccessResponseDto = createSuccessResponseSchema(Type.Null());
