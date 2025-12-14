import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { errorHandler } from './middleware/error-handler';
import healthRoutes from './routes/health';

const app = new OpenAPIHono();

// Middleware
app.use('*', logger());
app.onError(errorHandler);

// Routes
app.route('/', healthRoutes);

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

// Swagger UI
app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }));

// Start server
const port = 3001;
console.log(`🚀 Server is running on http://localhost:${port}`);
console.log(`📚 API docs available at http://localhost:${port}/api/docs`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
