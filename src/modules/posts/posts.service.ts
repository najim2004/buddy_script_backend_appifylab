import prisma from '../../infrastructure/prisma/client';
import Storage from '../../infrastructure/storage/storage';
import { DELETED_COMMENT_MESSAGE, STORAGE_PATHS } from '../../core/constants';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../core/errors/app.error';
import type {
  CreatePostDtoType,
  UpdatePostDtoType,
  CreateCommentDtoType,
} from './posts.schema';
import type {
  AttachmentType,
  CommentWithAuthor,
  DeletedComment,
  LikeWithUser,
  PaginatedResult,
  PostDetail,
  PostLatestComment,
  PostVisibility,
  PostVisibilityUpdate,
  UploadedPostFile,
} from './posts.types';
import { Prisma } from '../../../prisma/generated/client';

const userAvatarSelect = {
  id: true,
  first_name: true,
  last_name: true,
  avatar: true,
} as const;

const postDetailSelect = {
  id: true,
  created_at: true,
  content: true,
  visibility: true,
  status: true,
  post_type: true,
  author: { select: userAvatarSelect },
  attachments: {
    select: {
      id: true,
      type: true,
      file_path: true,
      file_name: true,
      mime_type: true,
      size_bytes: true,
    },
  },
  likes: {
    take: 5,
    orderBy: { created_at: 'desc' as const },
    select: {
      user: {
        select: {
          id: true,
          avatar: true,
        },
      },
    },
  },
  comments: {
    take: 1,
    orderBy: { created_at: 'desc' as const },
    select: {
      id: true,
      created_at: true,
      content: true,
      deleted_at: true,
      parent_id: true,
      user: { select: userAvatarSelect },
      _count: {
        select: { likes: true },
      },
    },
  },
  _count: {
    select: {
      comments: true,
      likes: true,
    },
  },
} satisfies Prisma.PostSelect;

type PostDetailRow = Prisma.PostGetPayload<{ select: typeof postDetailSelect }>;

function mapLatestComment(
  comment: PostDetailRow['comments'][number] | undefined,
): PostLatestComment | null {
  if (!comment) return null;

  const is_deleted = comment.deleted_at !== null;
  return {
    id: comment.id,
    created_at: comment.created_at,
    content: is_deleted ? DELETED_COMMENT_MESSAGE : comment.content,
    deleted_at: comment.deleted_at,
    parent_id: comment.parent_id,
    is_deleted,
    likes: comment._count.likes,
    user: comment.user,
  };
}

function mapPostDetail(post: PostDetailRow): PostDetail {
  const {
    _count,
    likes: recentLikeRows,
    comments: latestCommentRows,
    attachments,
    ...rest
  } = post;

  return {
    ...rest,
    comments: _count.comments,
    likes: _count.likes,
    recent_likes: recentLikeRows.map((like) => like.user),
    latest_comment: mapLatestComment(latestCommentRows[0]),
    attachments: attachments.map((att) => ({
      ...att,
      size_bytes: att.size_bytes !== null ? Number(att.size_bytes) : null,
      url: Storage.url(att.file_path),
    })),
  };
}

export class PostsService {
  async createPost(
    authorId: string,
    data: CreatePostDtoType,
    files: UploadedPostFile[] = [],
  ): Promise<PostDetail> {
    const content = data.content?.trim() || undefined;

    if (!content && files.length === 0) {
      throw new BadRequestError('Post must have either content or attachments');
    }

    const storedFiles: Prisma.AttachmentCreateManyInput[] = [];

    try {
      for (const file of files) {
        const { file_key, file_name } = Storage.generateFileMeta(
          file.filename,
          STORAGE_PATHS.POST,
        );

        let type: AttachmentType = 'FILE';
        if (file.mimetype.startsWith('image/')) type = 'IMAGE';
        else if (file.mimetype.startsWith('video/')) type = 'VIDEO';
        else if (file.mimetype.startsWith('audio/')) type = 'AUDIO';
        else if (
          file.mimetype.includes('pdf') ||
          file.mimetype.includes('document') ||
          file.mimetype.startsWith('text/')
        ) {
          type = 'DOCUMENT';
        }

        await Storage.put(file_key, file.buffer, file.mimetype);

        storedFiles.push({
          file_path: file_key,
          file_name,
          mime_type: file.mimetype,
          size_bytes: BigInt(file.buffer.byteLength),
          type,
        });
      }

      const post = await prisma.post.create({
        data: {
          author_id: authorId,
          content,
          visibility: data.visibility,
          post_type: data.post_type,
          attachments:
            storedFiles.length > 0
              ? {
                  create: storedFiles,
                }
              : undefined,
        },
        select: postDetailSelect,
      });

      return mapPostDetail(post);
    } catch (error) {
      await Promise.all(storedFiles.map((f) => Storage.delete(f.file_path)));
      throw error;
    }
  }

  async getPostById(id: string): Promise<PostDetail> {
    const post = await prisma.post.findUnique({
      where: { id },
      select: postDetailSelect,
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    return mapPostDetail(post);
  }

  async updatePost(
    id: string,
    userId: string,
    data: UpdatePostDtoType,
  ): Promise<PostDetail> {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        author_id: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    if (existing.author_id !== userId) {
      throw new ForbiddenError('You are not authorized to perform this action');
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content: data.content,
        post_type: data.post_type,
      },
      select: postDetailSelect,
    });

    return mapPostDetail(updatedPost);
  }

  async deletePost(id: string, userId: string): Promise<void> {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        author_id: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    if (existing.author_id !== userId) {
      throw new ForbiddenError('You are not authorized to perform this action');
    }

    const attachments = await prisma.attachment.findMany({
      where: { post_id: id },
      select: {
        file_path: true,
      },
    });

    await prisma.post.delete({
      where: { id },
      select: {
        id: true,
      },
    });

    await Promise.all(attachments.map((att) => Storage.delete(att.file_path)));
  }

  async updateVisibility(
    id: string,
    userId: string,
    visibility: PostVisibility,
  ): Promise<PostVisibilityUpdate> {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        author_id: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Post not found');
    }

    if (existing.author_id !== userId) {
      throw new ForbiddenError('You are not authorized to perform this action');
    }

    return prisma.post.update({
      where: { id },
      data: { visibility },
      select: {
        id: true,
        visibility: true,
        updated_at: true,
      },
    });
  }

  async toggleLike(
    userId: string,
    targetType: 'post' | 'comment',
    targetId: string,
  ): Promise<{ liked: boolean }> {
    if (targetType === 'post') {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!post) {
        throw new NotFoundError('Post not found');
      }
    } else {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          deleted_at: true,
        },
      });
      if (!comment || comment.deleted_at) {
        throw new NotFoundError('Comment not found');
      }
    }

    const existing = await prisma.like.findFirst({
      where: {
        user_id: userId,
        post_id: targetType === 'post' ? targetId : null,
        comment_id: targetType === 'comment' ? targetId : null,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id },
        select: {
          id: true,
        },
      });
      return { liked: false };
    }

    await prisma.like.create({
      data: {
        user_id: userId,
        post_id: targetType === 'post' ? targetId : undefined,
        comment_id: targetType === 'comment' ? targetId : undefined,
      },
      select: {
        id: true,
      },
    });

    return { liked: true };
  }

  async getLikesList(
    targetType: 'post' | 'comment',
    targetId: string,
    cursor?: string,
    limit = 10,
  ): Promise<PaginatedResult<LikeWithUser>> {
    if (targetType === 'post') {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!post) {
        throw new NotFoundError('Post not found');
      }
    } else {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        select: {
          id: true,
          deleted_at: true,
        },
      });
      if (!comment || comment.deleted_at) {
        throw new NotFoundError('Comment not found');
      }
    }

    const take = limit + 1;

    const likes = await prisma.like.findMany({
      where: {
        post_id: targetType === 'post' ? targetId : null,
        comment_id: targetType === 'comment' ? targetId : null,
      },
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        user_id: true,
        post_id: true,
        comment_id: true,
        user: {
          select: userAvatarSelect,
        },
      },
    });

    const has_next_page = likes.length > limit;
    const data = has_next_page ? likes.slice(0, limit) : likes;

    return {
      data,
      meta: {
        next_cursor: has_next_page ? data[data.length - 1].id : null,
        has_next_page,
      },
    };
  }

  async getPostsList(
    cursor?: string,
    limit = 10,
  ): Promise<PaginatedResult<PostDetail>> {
    const take = limit + 1;

    const posts = await prisma.post.findMany({
      where: { status: 'ACTIVE' },
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { created_at: 'desc' },
      select: postDetailSelect,
    });

    const has_next_page = posts.length > limit;
    const data = has_next_page ? posts.slice(0, limit) : posts;

    return {
      data: data.map(mapPostDetail),
      meta: {
        next_cursor: has_next_page ? data[data.length - 1].id : null,
        has_next_page,
      },
    };
  }

  async createComment(
    userId: string,
    postId: string,
    data: CreateCommentDtoType,
  ): Promise<CommentWithAuthor> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (data.parent_id) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parent_id },
        select: {
          id: true,
          deleted_at: true,
        },
      });

      if (!parentComment || parentComment.deleted_at) {
        throw new NotFoundError('Parent comment not found');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        user_id: userId,
        post_id: postId,
        content: data.content,
        parent_id: data.parent_id,
        reply_to_user_id: data.reply_to_user_id,
      },
      select: {
        id: true,
        created_at: true,
        post_id: true,
        content: true,
        parent_id: true,
        deleted_at: true,
        reply_to_user: {
          select: userAvatarSelect,
        },
        user: {
          select: userAvatarSelect,
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    const is_deleted = comment.deleted_at !== null;
    return {
      id: comment.id,
      created_at: comment.created_at,
      post_id: comment.post_id,
      parent_id: comment.parent_id,
      deleted_at: comment.deleted_at,
      content: is_deleted ? DELETED_COMMENT_MESSAGE : comment.content,
      is_deleted,
      likes: comment._count.likes,
      user: comment.user,
      reply_to_user: comment.reply_to_user,
    };
  }

  async deleteComment(
    commentId: string,
    userId: string,
  ): Promise<DeletedComment> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        user_id: true,
        deleted_at: true,
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!comment || comment.deleted_at) {
      throw new NotFoundError('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenError('You are not authorized to delete this comment');
    }

    // Soft-delete when replies exist so the thread stays intact.
    if (comment._count.replies > 0) {
      const softDeleted = await prisma.comment.update({
        where: { id: commentId },
        data: { deleted_at: new Date() },
        select: {
          id: true,
          deleted_at: true,
        },
      });

      return {
        id: softDeleted.id,
        soft_deleted: true,
        deleted_at: softDeleted.deleted_at,
      };
    }

    await prisma.comment.delete({
      where: { id: commentId },
      select: { id: true },
    });

    return {
      id: commentId,
      soft_deleted: false,
      deleted_at: null,
    };
  }
}

export const postsService = new PostsService();
export default postsService;
