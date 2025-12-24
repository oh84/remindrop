import { OpenAPIHono } from '@hono/zod-openapi';
import { auth } from '../../lib/auth';

const app = new OpenAPIHono();

// https://www.better-auth.com/docs/integrations/hono
app.on(['POST', 'GET'], '*', async (c) => {
  return auth.handler(c.req.raw);
});

export default app;
