import { FastifyInstance } from 'fastify';
import { SWAGGER_TAGS } from '../../docs/swagger';
import postsController from './posts.controller';
import {
  CreatePostMultipartDto,
  UpdatePostDto,
  UpdateVisibilityDto,
  CreateCommentDto,
  CursorPaginationQuery,
  ParamsWithId,
  PostDetailResponseDto,
  PostListResponseDto,
  CommentResponseDto,
  LikeToggleResponseDto,
  LikeListResponseDto,
  PostVisibilityUpdateResponseDto,
  DeletedCommentResponseDto,
  BasicSuccessResponseDto,
} from './posts.schema';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { flattenMultipartBody } from '../../core/utils/multipart';

export const postsRoute = async (fastify: FastifyInstance): Promise<void> => {
  const typedFastify = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // ---------------------------------------------------------------------------
  // GET /api/posts - List posts with cursor pagination
  // ---------------------------------------------------------------------------
  typedFastify.get(
    '/',
    {
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'List posts with cursor pagination',
        querystring: CursorPaginationQuery,
        response: { 200: PostListResponseDto },
      },
    },
    postsController.getPosts.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // POST /api/posts - Create a new post (multipart)
  // ---------------------------------------------------------------------------
  typedFastify.post(
    '/',
    {
      preValidation: async (request) => {
        flattenMultipartBody(request, ['attachments']);
      },
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Create a new post (multipart)',
        description:
          'Send `multipart/form-data` with optional text fields `content`, `visibility`, `post_type` and one or more file fields named `attachments`.',
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        body: CreatePostMultipartDto,
        response: { 200: PostDetailResponseDto },
      },
    },
    postsController.createPost.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // GET /api/posts/:id - Get post by ID
  // ---------------------------------------------------------------------------
  typedFastify.get(
    '/:id',
    {
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Get post by ID',
        params: ParamsWithId,
        response: { 200: PostDetailResponseDto },
      },
    },
    postsController.getPost.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/posts/:id - Update a post
  // ---------------------------------------------------------------------------
  typedFastify.patch(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Update a post',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
        body: UpdatePostDto,
        response: { 200: PostDetailResponseDto },
      },
    },
    postsController.updatePost.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/posts/:id - Delete a post
  // ---------------------------------------------------------------------------
  typedFastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Delete a post',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
        response: { 200: BasicSuccessResponseDto },
      },
    },
    postsController.deletePost.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/posts/:id/visibility - Update post visibility
  // ---------------------------------------------------------------------------
  typedFastify.patch(
    '/:id/visibility',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Update post visibility',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
        body: UpdateVisibilityDto,
        response: { 200: PostVisibilityUpdateResponseDto },
      },
    },
    postsController.updateVisibility.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // POST /api/posts/:id/like - Toggle like/unlike on a post
  // ---------------------------------------------------------------------------
  typedFastify.post(
    '/:id/like',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Toggle like/unlike on a post',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
        response: { 200: LikeToggleResponseDto },
      },
    },
    postsController.togglePostLike.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // POST /api/posts/comments/:id/like - Toggle like/unlike on a comment
  // ---------------------------------------------------------------------------
  typedFastify.post(
    '/comments/:id/like',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Toggle like/unlike on a comment',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
        response: { 200: LikeToggleResponseDto },
      },
    },
    postsController.toggleCommentLike.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // GET /api/posts/:id/likes - Get post likes with cursor pagination
  // ---------------------------------------------------------------------------
  typedFastify.get(
    '/:id/likes',
    {
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Get post likes with cursor pagination',
        params: ParamsWithId,
        querystring: CursorPaginationQuery,
        response: { 200: LikeListResponseDto },
      },
    },
    postsController.getPostLikes.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // GET /api/posts/comments/:id/likes - Get comment likes with cursor pagination
  // ---------------------------------------------------------------------------
  typedFastify.get(
    '/comments/:id/likes',
    {
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Get comment likes with cursor pagination',
        params: ParamsWithId,
        querystring: CursorPaginationQuery,
        response: { 200: LikeListResponseDto },
      },
    },
    postsController.getCommentLikes.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // POST /api/posts/:id/comments - Create a comment or reply on a post
  // ---------------------------------------------------------------------------
  typedFastify.post(
    '/:id/comments',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Create a comment or reply on a post',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
        body: CreateCommentDto,
        response: { 200: CommentResponseDto },
      },
    },
    postsController.createComment.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/posts/comments/:id - Delete a comment or reply
  // ---------------------------------------------------------------------------
  typedFastify.delete(
    '/comments/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Delete a comment or reply',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
        response: { 200: DeletedCommentResponseDto },
      },
    },
    postsController.deleteComment.bind(postsController),
  );
};

export default postsRoute;
