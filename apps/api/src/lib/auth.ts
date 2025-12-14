import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@repo/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true, // Use plural table names (users, sessions, accounts, etc.)
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // MVP段階では無効化
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7日間
    updateAge: 60 * 60 * 24, // 1日ごとに更新
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5分
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  trustedOrigins: [
    'http://localhost:3000', // Next.js dev server
    process.env.NEXT_PUBLIC_APP_URL || '',
  ].filter(Boolean),
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
