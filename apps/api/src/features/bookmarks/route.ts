import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import {
  BookmarkSchema,
  CreateBookmarkSchema,
  UpdateBookmarkSchema,
  BookmarkListSchema
} from '@repo/types';
import { AuthVariables } from '../../middleware/auth';
import { bookmarkService } from './service';

const app = new OpenAPIHono<{ Variables: AuthVariables }>();

// List Bookmarks
const listBookmarkRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Bookmarks'],
  summary: 'List user bookmarks',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).openapi({
        param: { name: 'page', in: 'query' },
        example: 1,
        description: 'Page number (1-indexed)',
      }),
      limit: z.coerce.number().int().min(1).max(100).default(20).openapi({
        param: { name: 'limit', in: 'query' },
        example: 20,
        description: 'Number of items per page (max 100)',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: BookmarkListSchema,
        },
      },
      description: 'List of bookmarks',
    },
  },
});

app.openapi(listBookmarkRoute, async (c) => {
  const user = c.get('user');
  const { page, limit } = c.req.valid('query');
  const { bookmarks, total } = await bookmarkService.list(user.id, page, limit);

  return c.json({
    bookmarks,
    total,
    page,
    limit,
  });
});

// Create Bookmark
const createBookmarkRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Bookmarks'],
  summary: 'Create a new bookmark',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateBookmarkSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: BookmarkSchema,
        },
      },
      description: 'Created bookmark',
    },
  },
});

app.openapi(createBookmarkRoute, async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');
  const bookmark = await bookmarkService.create(user.id, data);

  return c.json(bookmark, 201);
});

// Get Bookmark
const getBookmarkRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Bookmarks'],
  summary: 'Get bookmark by ID',
  request: {
    params: z.object({
      id: z.uuid().openapi({
        param: {
          name: 'id',
          in: 'path',
        },
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Bookmark ID',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: BookmarkSchema,
        },
      },
      description: 'The bookmark',
    },
    404: {
      description: 'Bookmark not found',
    },
  },
});

app.openapi(getBookmarkRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');

  const bookmark = await bookmarkService.get(id, user.id);
  if (!bookmark) {
    return c.json({ error: 'Bookmark not found' }, 404);
  }

  return c.json(bookmark);
});

// Update Bookmark
const updateBookmarkRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Bookmarks'],
  summary: 'Update bookmark',
  request: {
    params: z.object({
      id: z.uuid().openapi({
        param: { name: 'id', in: 'path' },
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Bookmark ID',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateBookmarkSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: BookmarkSchema,
        },
      },
      description: 'Updated bookmark',
    },
    404: {
      description: 'Bookmark not found',
    },
  },
});

app.openapi(updateBookmarkRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');
  const data = c.req.valid('json');

  const bookmark = await bookmarkService.update(id, user.id, data);
  if (!bookmark) {
    return c.json({ error: 'Bookmark not found' }, 404);
  }

  return c.json(bookmark);
});

// Delete Bookmark
const deleteBookmarkRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Bookmarks'],
  summary: 'Delete bookmark',
  request: {
    params: z.object({
      id: z.uuid().openapi({
        param: {
          name: 'id',
          in: 'path',
        },
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Bookmark ID',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: BookmarkSchema,
        },
      },
      description: 'Deleted bookmark',
    },
    404: {
      description: 'Bookmark not found',
    },
  },
});

app.openapi(deleteBookmarkRoute, async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');

  const bookmark = await bookmarkService.delete(id, user.id);
  if (!bookmark) {
    return c.json({ error: 'Bookmark not found' }, 404);
  }

  return c.json(bookmark);
});

export default app;
