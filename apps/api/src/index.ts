import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { errorHandler } from './middleware/error-handler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';

const app = new OpenAPIHono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', process.env.NEXT_PUBLIC_APP_URL || ''].filter(Boolean),
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
      url: 'http://localhost:3001',
      description: 'Local development server',
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
const port = 3001;
console.log(`🚀 Server is running on http://localhost:${port}`);
console.log(`📚 API docs available at http://localhost:${port}/api/docs`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
