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
  // ---------------------------------------------------------------------------
  // POST /api/posts - Create a new post (multipart)
  // ---------------------------------------------------------------------------
  async createPost(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const body = request.body as CreatePostMultipartDtoType;

    const data = {
      content: body.content,
      visibility: body.visibility,
      post_type: body.post_type,
    };

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

    const post = await postsService.createPost(userId, data, uploadedFiles);
    reply.send(successResponse(post, 'Post created successfully'));
  }

  // ---------------------------------------------------------------------------
  // GET /api/posts/:id - Get post by ID
  // ---------------------------------------------------------------------------
  async getPost(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.userId;
    const params = request.params as { id: string };
    const post = await postsService.getPostById(params.id, userId);
    reply.send(successResponse(post));
  }

  // ---------------------------------------------------------------------------
  // PATCH /api/posts/:id - Update a post
  // ---------------------------------------------------------------------------
  async updatePost(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const params = request.params as { id: string };
    const body = request.body as UpdatePostDtoType;
    const post = await postsService.updatePost(params.id, userId, body);
    reply.send(successResponse(post, 'Post updated successfully'));
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/posts/:id - Delete a post
  // ---------------------------------------------------------------------------
  async deletePost(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const params = request.params as { id: string };
    await postsService.deletePost(params.id, userId);
    reply.send(successResponse(null, 'Post deleted successfully'));
  }

  // ---------------------------------------------------------------------------
  // PATCH /api/posts/:id/visibility - Update post visibility
  // ---------------------------------------------------------------------------
  async updateVisibility(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const params = request.params as { id: string };
    const body = request.body as UpdateVisibilityDtoType;
    const post = await postsService.updateVisibility(
      params.id,
      userId,
      body.visibility,
    );
    reply.send(successResponse(post, 'Post visibility updated successfully'));
  }

  // ---------------------------------------------------------------------------
  // POST /api/posts/:id/like - Toggle like/unlike on a post
  // ---------------------------------------------------------------------------
  async togglePostLike(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const params = request.params as { id: string };
    const result = await postsService.toggleLike(userId, 'post', params.id);
    reply.send(
      successResponse(
        result,
        result.liked ? 'Post liked successfully' : 'Post unliked successfully',
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // POST /api/posts/comments/:id/like - Toggle like/unlike on a comment
  // ---------------------------------------------------------------------------
  async toggleCommentLike(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const params = request.params as { id: string };
    const result = await postsService.toggleLike(userId, 'comment', params.id);
    reply.send(
      successResponse(
        result,
        result.liked
          ? 'Comment liked successfully'
          : 'Comment unliked successfully',
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // GET /api/posts/:id/likes - Get post likes with cursor pagination
  // ---------------------------------------------------------------------------
  async getPostLikes(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const params = request.params as { id: string };
    const query = request.query as CursorPaginationQueryType;
    const result = await postsService.getLikesList(
      'post',
      params.id,
      query.cursor,
      query.limit,
    );
    reply.send(
      successResponse(result.data, 'Likes retrieved successfully', result.meta),
    );
  }

  // ---------------------------------------------------------------------------
  // GET /api/posts/comments/:id/likes - Get comment likes with cursor pagination
  // ---------------------------------------------------------------------------
  async getCommentLikes(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const params = request.params as { id: string };
    const query = request.query as CursorPaginationQueryType;
    const result = await postsService.getLikesList(
      'comment',
      params.id,
      query.cursor,
      query.limit,
    );
    reply.send(
      successResponse(result.data, 'Likes retrieved successfully', result.meta),
    );
  }

  // ---------------------------------------------------------------------------
  // GET /api/posts - List posts with cursor pagination
  // ---------------------------------------------------------------------------
  async getPosts(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.userId;
    const query = request.query as CursorPaginationQueryType;
    const result = await postsService.getPostsList(query.cursor, query.limit, userId);
    reply.send(
      successResponse(result.data, 'Posts retrieved successfully', result.meta),
    );
  }

  // ---------------------------------------------------------------------------
  // POST /api/posts/:id/comments - Create a comment or reply on a post
  // ---------------------------------------------------------------------------
  async createComment(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const params = request.params as { id: string };
    const body = request.body as CreateCommentDtoType;
    const comment = await postsService.createComment(userId, params.id, body);
    reply.send(successResponse(comment, 'Comment created successfully'));
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/posts/comments/:id - Delete a comment or reply
  // ---------------------------------------------------------------------------
  async deleteComment(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const params = request.params as { id: string };
    const result = await postsService.deleteComment(params.id, userId);
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
