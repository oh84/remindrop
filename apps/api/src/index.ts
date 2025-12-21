import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { errorHandler } from './middleware/error-handler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import { env } from './env';

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
app.onError(errorHandler);

// Routes
app.route('/', healthRoutes);
app.route('/api/auth', authRoutes);

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

// Start server
console.log(`🚀 Server is running on ${env.API_URL}`);
console.log(`📚 API docs available at ${env.API_URL}/api/docs`);

serve({
  fetch: app.fetch,
  port: env.API_PORT,
});

export default app;
