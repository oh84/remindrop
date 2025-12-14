import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

const app = new OpenAPIHono();

// Health check schema
const HealthCheckSchema = z.object({
  status: z.string().openapi({ example: 'ok' }),
  timestamp: z.string().datetime().openapi({ example: '2024-01-01T00:00:00.000Z' }),
  service: z.string().openapi({ example: 'remindrop-api' }),
  version: z.string().openapi({ example: '1.0.0' }),
});

// Health check route definition
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Health check endpoint',
  description: 'Check if the API server is running',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthCheckSchema,
        },
      },
      description: 'API is healthy',
    },
  },
});

// Implement health check
app.openapi(healthRoute, (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'remindrop-api',
    version: '1.0.0',
  });
});

export default app;
