import { createAuthClient } from 'better-auth/react';

const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

export const authClient = client;

// BetterAuthのhooksとメソッドを個別にエクスポート
export const signIn = client.signIn;
export const signUp = client.signUp;
export const signOut = client.signOut;
export const useSession = client.useSession;
