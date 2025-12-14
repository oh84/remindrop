#!/bin/bash

# PostgreSQL コンテナの起動確認と自動起動

set -e

echo "🔍 Checking PostgreSQL container..."

# Docker Composeが起動しているか確認
if docker compose ps | grep -q "postgres.*Up"; then
  echo "✅ PostgreSQL is already running"
else
  echo "🚀 Starting PostgreSQL..."
  docker compose up -d postgres

  # PostgreSQLが準備完了するまで待機
  echo "⏳ Waiting for PostgreSQL to be ready..."
  max_attempts=30
  attempt=0

  until docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
      echo "❌ PostgreSQL failed to start"
      exit 1
    fi
    echo "   Waiting... ($attempt/$max_attempts)"
    sleep 1
  done

  echo "✅ PostgreSQL is ready!"
fi

echo ""
echo "🚀 Starting development servers..."
echo "   - Web:  http://localhost:3000"
echo "   - API:  http://localhost:3001"
echo "   - Docs: http://localhost:3001/api/docs"
echo ""
