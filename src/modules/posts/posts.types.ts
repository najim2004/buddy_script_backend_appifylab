import type {
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

/** Latest likers preview on a post (id + avatar only). */
export type PostLiker = Pick<User, 'id' | 'avatar'>;

export type PostAttachment = {
  id: string;
  type: string;
  /** Raw storage key (e.g. `posts/abc.jpg`). Frontend resolves via Next proxy. */
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | null;
};

export type CommentRecord = Pick<
  Comment,
  'id' | 'created_at' | 'post_id' | 'content' | 'parent_id' | 'deleted_at'
>;

export type CommentWithAuthor = CommentRecord & {
  is_deleted: boolean;
  likes: number;
  has_liked: boolean;
  user: UserWithAvatar;
  reply_to_user: UserWithAvatar | null;
};

/** Same shape as full comment responses — keeps list/detail/create aligned. */
export type PostLatestComment = CommentWithAuthor;

export type PostDetail = Pick<
  Post,
  'id' | 'created_at' | 'content' | 'visibility' | 'status' | 'post_type'
> & {
  author: UserWithAvatar;
  attachments: PostAttachment[];
  comments: number;
  likes: number;
  has_liked: boolean;
  recent_likes: PostLiker[];
  latest_comment: PostLatestComment | null;
};

export type PostOwner = Pick<Post, 'id' | 'author_id'>;

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

export type DeletedComment = {
  id: string;
  soft_deleted: boolean;
  deleted_at: Date | null;
};

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
