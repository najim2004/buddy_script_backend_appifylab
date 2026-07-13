import { FastifyReply, FastifyRequest } from 'fastify';
import postsService from './posts.service';
import type { UploadedPostFile } from './posts.types';
import { successResponse } from '../../core/utils/response';
import { normalizeMultipartFiles } from '../../core/utils/multipart';
import {
  type CreatePostMultipartDtoType,
  type UpdatePostDtoType,
  type UpdateVisibilityDtoType,
  type CreateCommentDtoType,
  type CursorPaginationQueryType,
} from './posts.schema';

export class PostsController {
  async createPost(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const body = request.body as CreatePostMultipartDtoType;

    const uploadedFiles: UploadedPostFile[] = [];
    for (const part of normalizeMultipartFiles(body.attachments)) {
      const buffer = await part.toBuffer();
      if (!part.filename || buffer.byteLength === 0) continue;
      uploadedFiles.push({
        buffer,
        filename: part.filename,
        mimetype: part.mimetype,
      });
    }

    const post = await postsService.createPost(
      userId,
      {
        content: body.content,
        visibility: body.visibility,
        post_type: body.post_type,
      },
      uploadedFiles,
    );

    reply.send(successResponse(post, 'Post created successfully'));
  }

  async getPost(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = request.user;
    const { id } = request.params as { id: string };
    const post = await postsService.getPostById(id, userId);
    reply.send(successResponse(post));
  }

  async updatePost(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const { id } = request.params as { id: string };
    const body = request.body as UpdatePostDtoType;
    const post = await postsService.updatePost(id, userId, body);
    reply.send(successResponse(post, 'Post updated successfully'));
  }

  async deletePost(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const { id } = request.params as { id: string };
    await postsService.deletePost(id, userId);
    reply.send(successResponse(null, 'Post deleted successfully'));
  }

  async updateVisibility(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const { id } = request.params as { id: string };
    const body = request.body as UpdateVisibilityDtoType;
    const post = await postsService.updateVisibility(
      id,
      userId,
      body.visibility,
    );
    reply.send(successResponse(post, 'Post visibility updated successfully'));
  }

  async togglePostLike(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const { id } = request.params as { id: string };
    const result = await postsService.toggleLike(userId, 'post', id);
    reply.send(
      successResponse(
        result,
        result.liked ? 'Post liked successfully' : 'Post unliked successfully',
      ),
    );
  }

  async toggleCommentLike(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const { id } = request.params as { id: string };
    const result = await postsService.toggleLike(userId, 'comment', id);
    reply.send(
      successResponse(
        result,
        result.liked
          ? 'Comment liked successfully'
          : 'Comment unliked successfully',
      ),
    );
  }

  async getPostLikes(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const query = request.query as CursorPaginationQueryType;
    const result = await postsService.getLikesList(
      'post',
      id,
      query.cursor,
      query.limit,
    );
    reply.send(
      successResponse(result.data, 'Likes retrieved successfully', result.meta),
    );
  }

  async getCommentLikes(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const query = request.query as CursorPaginationQueryType;
    const result = await postsService.getLikesList(
      'comment',
      id,
      query.cursor,
      query.limit,
    );
    reply.send(
      successResponse(result.data, 'Likes retrieved successfully', result.meta),
    );
  }

  async getPosts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = request.user;
    const query = request.query as CursorPaginationQueryType;
    const result = await postsService.getPostsList(
      query.cursor,
      query.limit,
      userId,
    );
    reply.send(
      successResponse(result.data, 'Posts retrieved successfully', result.meta),
    );
  }

  async createComment(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const { id } = request.params as { id: string };
    const body = request.body as CreateCommentDtoType;
    const comment = await postsService.createComment(userId, id, body);
    reply.send(successResponse(comment, 'Comment created successfully'));
  }

  async getComments(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const { id } = request.params as { id: string };
    const query = request.query as CursorPaginationQueryType;
    const result = await postsService.getCommentsList(
      id,
      query.cursor,
      query.limit,
      userId,
    );
    reply.send(
      successResponse(
        result.data,
        'Comments retrieved successfully',
        result.meta,
      ),
    );
  }

  async deleteComment(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const { id } = request.params as { id: string };
    const result = await postsService.deleteComment(id, userId);
    reply.send(
      successResponse(
        result,
        result.soft_deleted
          ? 'Comment soft-deleted successfully'
          : 'Comment deleted successfully',
      ),
    );
  }
}

export const postsController = new PostsController();
export default postsController;
