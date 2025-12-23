import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { env } from './env';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './handlers/error';
import { notFoundHandler } from './handlers/not-found';
import healthRoute from './features/health';
import authRoute from './features/auth';
import bookmarkRoute from './features/bookmarks';

const app = new OpenAPIHono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [env.WEB_URL].filter(Boolean),
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

// Handlers
app.onError(errorHandler);
app.notFound(notFoundHandler);

// OpenAPI documentation
app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Remindrop API',
    description: 'AI-powered bookmark management API with daily email digests',
  },
  servers: [
    {
      url: env.API_URL,
      description: 'API server',
    },
  ],
});

// Scalar API Reference with multiple sources
app.get(
  '/api/docs',
  Scalar({
    pageTitle: 'Remindrop API Documentation',
    sources: [
      { url: '/api/openapi.json', title: 'Remindrop API' },
      { url: '/api/auth/open-api/generate-schema', title: 'Auth' },
    ],
  })
);

// Public Routes
app.route('/api/health', healthRoute);
app.route('/api/auth', authRoute);

// Protected Routes
const protectedApp = new OpenAPIHono();
protectedApp.use('*', authMiddleware);
protectedApp.route('/api/bookmarks', bookmarkRoute);
app.route('/', protectedApp);

// Start server
console.log(`🚀 Server is running on ${env.API_URL}`);
console.log(`📚 API docs available at ${env.API_URL}/api/docs`);

serve({
  fetch: app.fetch,
  port: env.API_PORT,
});

export default app;
