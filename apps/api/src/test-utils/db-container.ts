import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer | null = null;

/**
 * PostgreSQLコンテナを起動してDATABASE_URLを設定
 */
export async function startTestDatabase(): Promise<void> {
  if (!container) {
    console.log('Starting PostgreSQL container...');
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('remindrop_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    process.env.DATABASE_URL = container.getConnectionUri();
    console.log(`PostgreSQL container started: ${container.getConnectionUri()}`);
  }
}

/**
 * PostgreSQLコンテナを停止
 */
export async function stopTestDatabase(): Promise<void> {
  if (container) {
    console.log('Stopping PostgreSQL container...');
    await container.stop();
    container = null;
    console.log('PostgreSQL container stopped');
  }
}
