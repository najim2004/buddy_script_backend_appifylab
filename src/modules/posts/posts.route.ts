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
} from './posts.schema';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export const postsRoute = async (fastify: FastifyInstance): Promise<void> => {
  const typedFastify = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // ---------------------------------------------------------------------------
  // Posts CRUD
  // ---------------------------------------------------------------------------

  typedFastify.get(
    '/',
    {
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'List posts with cursor pagination',
        querystring: CursorPaginationQuery,
      },
    },
    postsController.getPosts.bind(postsController),
  );

  typedFastify.post(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Create a new post (multipart)',
        description:
          'Send `multipart/form-data` with optional text fields `content`, `visibility`, `post_type` and one or more file fields named `attachments`.',
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        body: CreatePostMultipartDto,
      },
    },
    postsController.createPost.bind(postsController),
  );

  typedFastify.get(
    '/:id',
    {
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Get post by ID',
        params: ParamsWithId,
      },
    },
    postsController.getPost.bind(postsController),
  );

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
      },
    },
    postsController.updatePost.bind(postsController),
  );

  typedFastify.delete(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Delete a post',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
      },
    },
    postsController.deletePost.bind(postsController),
  );

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
      },
    },
    postsController.updateVisibility.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // Likes
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
      },
    },
    postsController.togglePostLike.bind(postsController),
  );

  typedFastify.post(
    '/comments/:id/like',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Toggle like/unlike on a comment',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
      },
    },
    postsController.toggleCommentLike.bind(postsController),
  );

  typedFastify.get(
    '/:id/likes',
    {
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Get post likes with cursor pagination',
        params: ParamsWithId,
        querystring: CursorPaginationQuery,
      },
    },
    postsController.getPostLikes.bind(postsController),
  );

  typedFastify.get(
    '/comments/:id/likes',
    {
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Get comment likes with cursor pagination',
        params: ParamsWithId,
        querystring: CursorPaginationQuery,
      },
    },
    postsController.getCommentLikes.bind(postsController),
  );

  // ---------------------------------------------------------------------------
  // Comments
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
      },
    },
    postsController.createComment.bind(postsController),
  );

  typedFastify.delete(
    '/comments/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'Delete a comment or reply',
        security: [{ bearerAuth: [] }],
        params: ParamsWithId,
      },
    },
    postsController.deleteComment.bind(postsController),
  );
};

export default postsRoute;
