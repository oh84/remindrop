import type { NotFoundHandler } from 'hono';

export const notFoundHandler: NotFoundHandler = (c) => {
  return c.json(
    {
      error: 'Not Found',
      message: `The requested resource '${c.req.path}' was not found`,
    },
    404
  );
};
