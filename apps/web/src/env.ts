import { z } from 'zod';

const envSchema = z.object({
  // Next.js Public Variables (available in browser)
  NEXT_PUBLIC_API_URL: z.string().url(),
});

// Validate environment variables at build time
const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
