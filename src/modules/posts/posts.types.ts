import type {
  Attachment,
  Comment,
  Like,
  Post,
  User,
  AttachmentType,
  PostVisibility,
} from '../../../prisma/generated/client';

export type UserWithAvatar = Pick<
  User,
  'id' | 'first_name' | 'last_name' | 'avatar'
>;

export type PostAttachment = Pick<
  Attachment,
  'id' | 'type' | 'file_path' | 'file_name' | 'mime_type'
> & {
  size_bytes: number | null;
};

export type PostDetail = Pick<
  Post,
  'id' | 'created_at' | 'content' | 'visibility' | 'status' | 'post_type'
> & {
  author: UserWithAvatar;
  attachments: PostAttachment[];
  comments: number;
  likes: number;
};

export type PostOwner = Pick<Post, 'id' | 'author_id'>;

export type CommentRecord = Pick<
  Comment,
  | 'id'
  | 'created_at'
  | 'post_id'
  | 'content'
  | 'parent_id'
>;

export type CommentWithAuthor = CommentRecord & {
  user: UserWithAvatar;
  reply_to_user: UserWithAvatar | null;
};

export type LikeWithUser = Pick<
  Like,
  'id' | 'created_at' | 'user_id' | 'post_id' | 'comment_id'
> & {
  user: UserWithAvatar;
};

export type PostVisibilityUpdate = Pick<
  Post,
  'id' | 'visibility' | 'updated_at'
>;

export type DeletedComment = Pick<Comment, 'id' | 'deleted_at'>;

export type UploadedPostFile = {
  buffer: Buffer;
  filename: string;
  mimetype: string;
};

export type PaginatedMeta = {
  next_cursor: string | null;
  has_next_page: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginatedMeta;
};

export type { AttachmentType, PostVisibility };
