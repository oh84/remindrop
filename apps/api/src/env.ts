import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // API Server
  API_URL: z.string().url(),
  API_PORT: z.string().transform(Number).pipe(z.number().positive()),

  // BetterAuth
  BETTER_AUTH_SECRET: z.string().min(32, {
    message: 'BETTER_AUTH_SECRET must be at least 32 characters for security',
  }),

  // Web Application
  WEB_URL: z.string().url(),
});

// 起動時に環境変数を検証
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
