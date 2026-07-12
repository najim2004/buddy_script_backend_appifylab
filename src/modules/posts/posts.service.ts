import { postsRepository } from './posts.repository';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../core/errors/app.error';
import type {
  CreatePostDtoType,
  UpdatePostDtoType,
  CreateCommentDtoType,
} from './posts.schema';

export class PostsService {
  async createPost(authorId: string, data: CreatePostDtoType) {
    if (!data.content && (!data.attachments || data.attachments.length === 0)) {
      throw new BadRequestError('Post must have either content or attachments');
    }
    return postsRepository.createPost(authorId, data);
  }

  async getPostById(id: string) {
    const post = await postsRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    return post;
  }

  async updatePost(id: string, userId: string, data: UpdatePostDtoType) {
    const post = await this.getPostById(id);
    if (post.author_id !== userId) {
      throw new ForbiddenError('You are not authorized to update this post');
    }
    return postsRepository.updatePost(id, data);
  }

  async deletePost(id: string, userId: string) {
    const post = await this.getPostById(id);
    if (post.author_id !== userId) {
      throw new ForbiddenError('You are not authorized to delete this post');
    }
    return postsRepository.deletePost(id);
  }

  async updateVisibility(id: string, userId: string, visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS') {
    const post = await this.getPostById(id);
    if (post.author_id !== userId) {
      throw new ForbiddenError('You are not authorized to update visibility for this post');
    }
    return postsRepository.updateVisibility(id, visibility);
  }

  async toggleLike(userId: string, targetType: 'post' | 'comment', targetId: string) {
    if (targetType === 'post') {
      await this.getPostById(targetId);
    } else {
      const comment = await postsRepository.findCommentById(targetId);
      if (!comment || comment.deleted_at) {
        throw new NotFoundError('Comment not found');
      }
    }
    return postsRepository.toggleLike(userId, targetType, targetId);
  }

  async getLikesList(targetType: 'post' | 'comment', targetId: string, cursor?: string, limit?: number) {
    if (targetType === 'post') {
      await this.getPostById(targetId);
    } else {
      const comment = await postsRepository.findCommentById(targetId);
      if (!comment || comment.deleted_at) {
        throw new NotFoundError('Comment not found');
      }
    }
    return postsRepository.findLikesCursor(targetType, targetId, cursor, limit);
  }

  async getPostsList(cursor?: string, limit?: number) {
    return postsRepository.findPostsCursor(cursor, limit);
  }

  async createComment(userId: string, postId: string, data: CreateCommentDtoType) {
    await this.getPostById(postId);

    if (data.parent_id) {
      const parentComment = await postsRepository.findCommentById(data.parent_id);
      if (!parentComment || parentComment.deleted_at) {
        throw new NotFoundError('Parent comment not found');
      }
    }

    return postsRepository.createComment(userId, postId, data);
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await postsRepository.findCommentById(commentId);
    if (!comment || comment.deleted_at) {
      throw new NotFoundError('Comment not found');
    }
    if (comment.user_id !== userId) {
      throw new ForbiddenError('You are not authorized to delete this comment');
    }
    return postsRepository.deleteComment(commentId);
  }
}

export const postsService = new PostsService();
export default postsService;
