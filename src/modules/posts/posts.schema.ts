import { Type, Static } from '@sinclair/typebox';

export const AttachmentTypeEnum = Type.Union([
  Type.Literal('IMAGE'),
  Type.Literal('DOCUMENT'),
  Type.Literal('VIDEO'),
  Type.Literal('AUDIO'),
  Type.Literal('FILE'),
]);

export const CreateAttachmentDto = Type.Object({
  file_path: Type.String({ minLength: 1 }),
  type: Type.Optional(AttachmentTypeEnum),
  file_name: Type.Optional(Type.String()),
  mime_type: Type.Optional(Type.String()),
  size_bytes: Type.Optional(Type.Number()),
});

export const CreatePostDto = Type.Object({
  content: Type.Optional(Type.String()),
  attachments: Type.Optional(Type.Array(CreateAttachmentDto)),
  visibility: Type.Optional(
    Type.Union([
      Type.Literal('PUBLIC'),
      Type.Literal('PRIVATE'),
      Type.Literal('FRIENDS'),
    ]),
  ),
  post_type: Type.Optional(
    Type.Union([
      Type.Literal('NORMAL'),
      Type.Literal('EVENT'),
      Type.Literal('ARTICLE'),
    ]),
  ),
});

export type CreatePostDtoType = Static<typeof CreatePostDto>;

export const UpdatePostDto = Type.Object({
  content: Type.Optional(Type.String()),
  attachments: Type.Optional(Type.Array(CreateAttachmentDto)),
  post_type: Type.Optional(
    Type.Union([
      Type.Literal('NORMAL'),
      Type.Literal('EVENT'),
      Type.Literal('ARTICLE'),
    ]),
  ),
});

export type UpdatePostDtoType = Static<typeof UpdatePostDto>;

export const UpdateVisibilityDto = Type.Object({
  visibility: Type.Union([
    Type.Literal('PUBLIC'),
    Type.Literal('PRIVATE'),
    Type.Literal('FRIENDS'),
  ]),
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
