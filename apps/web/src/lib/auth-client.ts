import { createAuthClient } from 'better-auth/react';
import { env } from '../env';

const client = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
});

export const authClient = client;

// BetterAuthのhooksとメソッドを個別にエクスポート
export const signIn = client.signIn;
export const signUp = client.signUp;
export const signOut = client.signOut;
export const useSession = client.useSession;
