import { prisma } from '../../infrastructure/prisma/client';
import type { Post, Comment, Like, Attachment } from '../../../prisma/generated/client';
import type {
  CreatePostDtoType,
  UpdatePostDtoType,
  CreateCommentDtoType,
} from './posts.schema';

export interface SerializedAttachment extends Omit<Attachment, 'size_bytes'> {
  size_bytes: number | null;
}

export interface SerializedPost extends Post {
  author: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
  };
  attachments: SerializedAttachment[];
  _count: {
    comments: number;
    likes: number;
  };
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

export class PostsRepository {
  async findById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        attachments: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  async createPost(authorId: string, data: CreatePostDtoType): Promise<Post> {
    const { content, visibility, post_type, attachments } = data;

    return prisma.post.create({
      data: {
        author_id: authorId,
        content,
        visibility,
        post_type,
        attachments: attachments
          ? {
              create: attachments.map((att) => ({
                file_path: att.file_path,
                type: att.type,
                file_name: att.file_name,
                mime_type: att.mime_type,
                size_bytes: att.size_bytes ? BigInt(att.size_bytes) : undefined,
              })),
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });
  }

  async updatePost(id: string, data: UpdatePostDtoType): Promise<Post> {
    const { content, post_type, attachments } = data;

    // Use transaction to update post and sync attachments
    return prisma.$transaction(async (tx) => {
      if (attachments !== undefined) {
        // Delete existing attachments
        await tx.attachment.deleteMany({
          where: { post_id: id },
        });
      }

      return tx.post.update({
        where: { id },
        data: {
          content,
          post_type,
          attachments: attachments
            ? {
                create: attachments.map((att) => ({
                  file_path: att.file_path,
                  type: att.type,
                  file_name: att.file_name,
                  mime_type: att.mime_type,
                  size_bytes: att.size_bytes ? BigInt(att.size_bytes) : undefined,
                })),
              }
            : undefined,
        },
        include: {
          attachments: true,
        },
      });
    });
  }

  async deletePost(id: string): Promise<Post> {
    return prisma.post.delete({
      where: { id },
    });
  }

  async updateVisibility(id: string, visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS'): Promise<Post> {
    return prisma.post.update({
      where: { id },
      data: { visibility },
    });
  }

  async toggleLike(
    userId: string,
    targetType: 'post' | 'comment',
    targetId: string,
  ): Promise<{ liked: boolean }> {
    // Since compound unique index might not be configured exactly this way in Prisma,
    // let's do a findFirst check first to ensure absolute safety and compatibility
    const existing = await prisma.like.findFirst({
      where: {
        user_id: userId,
        post_id: targetType === 'post' ? targetId : null,
        comment_id: targetType === 'comment' ? targetId : null,
      },
    });

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id },
      });
      return { liked: false };
    } else {
      await prisma.like.create({
        data: {
          user_id: userId,
          post_id: targetType === 'post' ? targetId : undefined,
          comment_id: targetType === 'comment' ? targetId : undefined,
        },
      });
      return { liked: true };
    }
  }

  async findLikesCursor(
    targetType: 'post' | 'comment',
    targetId: string,
    cursor?: string,
    limit = 10,
  ): Promise<PaginatedResult<Like & { user: { id: string; name: string | null; username: string | null; avatar: string | null } }>> {
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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const hasNextPage = likes.length > limit;
    const data = hasNextPage ? likes.slice(0, limit) : likes;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    return {
      data,
      meta: {
        nextCursor,
        hasNextPage,
      },
    };
  }

  async findPostsCursor(
    cursor?: string,
    limit = 10,
  ): Promise<PaginatedResult<SerializedPost>> {
    const take = limit + 1;

    const posts = await prisma.post.findMany({
      where: { status: 'ACTIVE' },
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { created_at: 'desc' },
      include: {
        attachments: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    const hasNextPage = posts.length > limit;
    const data = hasNextPage ? posts.slice(0, limit) : posts;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    // Helper to serialize BigInt size_bytes inside attachments
    const serializedData = data.map((post) => ({
      ...post,
      attachments: post.attachments.map((att) => ({
        ...att,
        size_bytes: att.size_bytes ? Number(att.size_bytes) : null,
      })),
    }));

    return {
      data: serializedData as unknown as SerializedPost[],
      meta: {
        nextCursor,
        hasNextPage,
      },
    };
  }

  async findCommentById(id: string): Promise<Comment | null> {
    return prisma.comment.findUnique({
      where: { id },
    });
  }

  async createComment(
    userId: string,
    postId: string,
    data: CreateCommentDtoType,
  ): Promise<Comment> {
    const { content, parent_id, reply_to_user_id } = data;

    return prisma.comment.create({
      data: {
        user_id: userId,
        post_id: postId,
        content,
        parent_id,
        reply_to_user_id,
      },
    });
  }

  async deleteComment(id: string): Promise<Comment> {
    // Soft delete comments by setting deleted_at
    return prisma.comment.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}

export const postsRepository = new PostsRepository();
export default postsRepository;
