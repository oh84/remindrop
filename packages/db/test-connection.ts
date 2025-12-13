#!/usr/bin/env node
// Database connection test script
import 'dotenv/config';
import { db } from './src/index';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');

    // Execute a simple query
    const result = await db.execute(sql`SELECT NOW() as current_time`);

    console.log('✅ Database connection successful!');
    console.log('Current time from database:', result[0]);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
