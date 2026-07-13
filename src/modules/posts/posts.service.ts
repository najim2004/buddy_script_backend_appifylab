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
        select: {
          id: true,
          created_at: true,
          content: true,
          visibility: true,
          status: true,
          post_type: true,
          author: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar: true,
            },
          },
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
              post_id: true,
              content: true,
              deleted_at: true,
              parent_id: true,
              reply_to_user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                },
              },
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                },
              },
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
        },
      });

      let latest_comment: PostLatestComment | null = null;
      if (post.comments[0]) {
        const c = post.comments[0];
        const is_deleted = c.deleted_at !== null;
        latest_comment = {
          id: c.id,
          created_at: c.created_at,
          post_id: c.post_id,
          content: is_deleted ? DELETED_COMMENT_MESSAGE : c.content,
          deleted_at: c.deleted_at,
          parent_id: c.parent_id,
          is_deleted,
          likes: c._count.likes,
          has_liked: false,
          user: c.user,
          reply_to_user: c.reply_to_user,
        };
      }

      return {
        id: post.id,
        created_at: post.created_at,
        content: post.content,
        visibility: post.visibility,
        status: post.status,
        post_type: post.post_type,
        author: post.author,
        comments: post._count.comments,
        likes: post._count.likes,
        has_liked: false,
        recent_likes: post.likes.map((like) => like.user),
        latest_comment,
        attachments: post.attachments.map((att) => ({
          id: att.id,
          type: att.type ?? 'FILE',
          file_path: att.file_path,
          file_name: att.file_name ?? '',
          mime_type: att.mime_type ?? '',
          size_bytes: att.size_bytes !== null ? Number(att.size_bytes) : null,
        })),
      };
    } catch (error) {
      await Promise.all(storedFiles.map((f) => Storage.delete(f.file_path)));
      throw error;
    }
  }

  async getPostById(id: string, currentUserId: string): Promise<PostDetail> {
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        created_at: true,
        content: true,
        visibility: true,
        status: true,
        post_type: true,
        author: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
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
          orderBy: { created_at: 'desc' },
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
          orderBy: { created_at: 'desc' },
          select: {
              id: true,
              created_at: true,
              post_id: true,
              content: true,
              deleted_at: true,
              parent_id: true,
              reply_to_user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                },
              },
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                },
              },
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
      },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const like = await prisma.like.findFirst({
      where: { user_id: currentUserId, post_id: id },
      select: { id: true },
    });
    const has_liked = !!like;

    let latestCommentLiked = false;
    const latestId = post.comments[0]?.id;
    if (latestId) {
      const commentLike = await prisma.like.findFirst({
        where: { user_id: currentUserId, comment_id: latestId },
        select: { id: true },
      });
      latestCommentLiked = !!commentLike;
    }

    let latest_comment: PostLatestComment | null = null;
    if (post.comments[0]) {
      const c = post.comments[0];
      const is_deleted = c.deleted_at !== null;
      latest_comment = {
        id: c.id,
        created_at: c.created_at,
        post_id: c.post_id,
        content: is_deleted ? DELETED_COMMENT_MESSAGE : c.content,
        deleted_at: c.deleted_at,
        parent_id: c.parent_id,
        is_deleted,
        likes: c._count.likes,
        has_liked: latestCommentLiked,
        user: c.user,
        reply_to_user: c.reply_to_user,
      };
    }

    return {
      id: post.id,
      created_at: post.created_at,
      content: post.content,
      visibility: post.visibility,
      status: post.status,
      post_type: post.post_type,
      author: post.author,
      comments: post._count.comments,
      likes: post._count.likes,
      has_liked,
      recent_likes: post.likes.map((like) => like.user),
      latest_comment,
      attachments: post.attachments.map((att) => ({
        id: att.id,
        type: att.type ?? 'FILE',
        file_path: att.file_path,
        file_name: att.file_name ?? '',
        mime_type: att.mime_type ?? '',
        size_bytes: att.size_bytes !== null ? Number(att.size_bytes) : null,
      })),
    };
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
      select: {
        id: true,
        created_at: true,
        content: true,
        visibility: true,
        status: true,
        post_type: true,
        author: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
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
              post_id: true,
              content: true,
              deleted_at: true,
              parent_id: true,
              reply_to_user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                },
              },
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                },
              },
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
      },
    });

    const like = await prisma.like.findFirst({
      where: { user_id: userId, post_id: id },
      select: { id: true },
    });
    const has_liked = !!like;

    let latestCommentLiked = false;
    const latestId = updatedPost.comments[0]?.id;
    if (latestId) {
      const commentLike = await prisma.like.findFirst({
        where: { user_id: userId, comment_id: latestId },
        select: { id: true },
      });
      latestCommentLiked = !!commentLike;
    }

    let latest_comment: PostLatestComment | null = null;
    if (updatedPost.comments[0]) {
      const c = updatedPost.comments[0];
      const is_deleted = c.deleted_at !== null;
      latest_comment = {
        id: c.id,
        created_at: c.created_at,
        post_id: c.post_id,
        content: is_deleted ? DELETED_COMMENT_MESSAGE : c.content,
        deleted_at: c.deleted_at,
        parent_id: c.parent_id,
        is_deleted,
        likes: c._count.likes,
        has_liked: latestCommentLiked,
        user: c.user,
        reply_to_user: c.reply_to_user,
      };
    }

    return {
      id: updatedPost.id,
      created_at: updatedPost.created_at,
      content: updatedPost.content,
      visibility: updatedPost.visibility,
      status: updatedPost.status,
      post_type: updatedPost.post_type,
      author: updatedPost.author,
      comments: updatedPost._count.comments,
      likes: updatedPost._count.likes,
      has_liked,
      recent_likes: updatedPost.likes.map((like) => like.user),
      latest_comment,
      attachments: updatedPost.attachments.map((att) => ({
        id: att.id,
        type: att.type ?? 'FILE',
        file_path: att.file_path,
        file_name: att.file_name ?? '',
        mime_type: att.mime_type ?? '',
        size_bytes: att.size_bytes !== null ? Number(att.size_bytes) : null,
      })),
    };
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
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
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
    cursor: string | undefined,
    limit = 10,
    currentUserId: string,
  ): Promise<PaginatedResult<PostDetail>> {
    const take = limit + 1;

    const posts = await prisma.post.findMany({
      where: { status: 'ACTIVE' },
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        content: true,
        visibility: true,
        status: true,
        post_type: true,
        author: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
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
              post_id: true,
              content: true,
              deleted_at: true,
              parent_id: true,
              reply_to_user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                },
              },
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  avatar: true,
                },
              },
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
      },
    });

    const has_next_page = posts.length > limit;
    const data = has_next_page ? posts.slice(0, limit) : posts;

    let userLikedPostIds = new Set<string>();
    let userLikedCommentIds = new Set<string>();
    if (data.length > 0) {
      const likes = await prisma.like.findMany({
        where: {
          user_id: currentUserId,
          post_id: { in: data.map((p) => p.id) },
        },
        select: { post_id: true },
      });
      userLikedPostIds = new Set(likes.map((l) => l.post_id as string));

      const latestCommentIds = data
        .map((p) => p.comments[0]?.id)
        .filter((id): id is string => Boolean(id));

      if (latestCommentIds.length > 0) {
        const commentLikes = await prisma.like.findMany({
          where: {
            user_id: currentUserId,
            comment_id: { in: latestCommentIds },
          },
          select: { comment_id: true },
        });
        userLikedCommentIds = new Set(
          commentLikes.map((l) => l.comment_id as string),
        );
      }
    }

    return {
      data: data.map((post) => {
        let latest_comment: PostLatestComment | null = null;
        if (post.comments[0]) {
          const c = post.comments[0];
          const is_deleted = c.deleted_at !== null;
          latest_comment = {
            id: c.id,
            created_at: c.created_at,
            post_id: c.post_id,
            content: is_deleted ? DELETED_COMMENT_MESSAGE : c.content,
            deleted_at: c.deleted_at,
            parent_id: c.parent_id,
            is_deleted,
            likes: c._count.likes,
            has_liked: userLikedCommentIds.has(c.id),
            user: c.user,
            reply_to_user: c.reply_to_user,
          };
        }

        return {
          id: post.id,
          created_at: post.created_at,
          content: post.content,
          visibility: post.visibility,
          status: post.status,
          post_type: post.post_type,
          author: post.author,
          comments: post._count.comments,
          likes: post._count.likes,
          has_liked: userLikedPostIds.has(post.id),
          recent_likes: post.likes.map((like) => like.user),
          latest_comment,
          attachments: post.attachments.map((att) => ({
            id: att.id,
            type: att.type ?? 'FILE',
            file_path: att.file_path,
            file_name: att.file_name ?? '',
            mime_type: att.mime_type ?? '',
            size_bytes: att.size_bytes !== null ? Number(att.size_bytes) : null,
          })),
        };
      }),
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
          parent_id: true,
          user_id: true,
          post_id: true,
        },
      });

      if (
        !parentComment ||
        parentComment.deleted_at ||
        parentComment.post_id !== postId
      ) {
        throw new NotFoundError('Parent comment not found');
      }

      // Max 2 levels: replies always hang under the root comment.
      const rootParentId = parentComment.parent_id ?? parentComment.id;
      const replyToUserId = data.reply_to_user_id ?? parentComment.user_id;

      const comment = await prisma.comment.create({
        data: {
          user_id: userId,
          post_id: postId,
          content: data.content,
          parent_id: rootParentId,
          reply_to_user_id: replyToUserId,
        },
        select: {
          id: true,
          created_at: true,
          post_id: true,
          content: true,
          parent_id: true,
          deleted_at: true,
          reply_to_user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar: true,
            },
          },
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              avatar: true,
            },
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
        has_liked: false,
        user: comment.user,
        reply_to_user: comment.reply_to_user,
      };
    }

    const comment = await prisma.comment.create({
      data: {
        user_id: userId,
        post_id: postId,
        content: data.content,
        parent_id: null,
        reply_to_user_id: null,
      },
      select: {
        id: true,
        created_at: true,
        post_id: true,
        content: true,
        parent_id: true,
        deleted_at: true,
        reply_to_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
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
      has_liked: false,
      user: comment.user,
      reply_to_user: comment.reply_to_user,
    };
  }

  async getCommentsList(
    postId: string,
    cursor: string | undefined,
    limit = 20,
    currentUserId: string,
  ): Promise<PaginatedResult<CommentWithAuthor>> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const take = limit + 1;
    const comments = await prisma.comment.findMany({
      where: { post_id: postId },
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        created_at: true,
        post_id: true,
        content: true,
        parent_id: true,
        deleted_at: true,
        reply_to_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    const has_next_page = comments.length > limit;
    const page = has_next_page ? comments.slice(0, limit) : comments;

    let userLikedCommentIds = new Set<string>();
    if (page.length > 0) {
      const likes = await prisma.like.findMany({
        where: {
          user_id: currentUserId,
          comment_id: { in: page.map((c) => c.id) },
        },
        select: { comment_id: true },
      });
      userLikedCommentIds = new Set(
        likes.map((l) => l.comment_id as string),
      );
    }

    return {
      data: page.map((comment) => {
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
          has_liked: userLikedCommentIds.has(comment.id),
          user: comment.user,
          reply_to_user: comment.reply_to_user,
        };
      }),
      meta: {
        next_cursor: has_next_page ? page[page.length - 1].id : null,
        has_next_page,
      },
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
