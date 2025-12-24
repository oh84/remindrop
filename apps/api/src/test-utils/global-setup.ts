import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { startTestDatabase, stopTestDatabase } from './db-container';

/**
 * 全テスト実行前に1度だけ実行
 */
export async function setup() {
  // 環境変数を設定（DATABASE_URLはdb-container.tsで設定）
  process.env.NODE_ENV = 'test';
  process.env.API_URL = 'http://localhost:3001';
  process.env.API_PORT = '3001';
  process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only-min-32-chars';
  process.env.WEB_URL = 'http://localhost:3000';

  console.log('🐳 Starting PostgreSQL test container...');
  await startTestDatabase();

  // マイグレーション適用
  console.log('📦 Running database migrations...');
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: './migrations' });
  await client.end();

  console.log('✅ Test database ready');
}

/**
 * 全テスト実行後に1度だけ実行
 */
export async function teardown() {
  console.log('🛑 Stopping PostgreSQL test container...');
  await stopTestDatabase();
  console.log('✅ Test container stopped');
}
