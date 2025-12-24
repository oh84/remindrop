import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Error:', err);

  return c.json(
    {
      error: err.message || 'Internal Server Error',
      status: 'error',
    },
    500
  );
};
