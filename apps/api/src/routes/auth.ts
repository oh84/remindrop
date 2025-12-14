import { OpenAPIHono } from '@hono/zod-openapi';
import { auth } from '../lib/auth';

const app = new OpenAPIHono();

// BetterAuthのすべてのルートをマウント
// BetterAuth は /api/auth/* 配下のルートを自動的に処理
app.all('*', async (c) => {
  return auth.handler(c.req.raw);
});

export default app;
