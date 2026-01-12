# Hono API Server

Remindrop のバックエンド API サーバー。

## 技術スタック

- **Hono**: 軽量で高速な Web フレームワーク
- **@hono/zod-openapi**: OpenAPI 仕様の自動生成
- **Zod**: スキーマバリデーション
- **TypeScript**: 型安全な開発
- **Drizzle ORM**: 型安全なデータベースアクセス
- **BetterAuth**: 認証ライブラリ
- **Vitest**: テストフレームワーク

## 開発

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# 型チェック
pnpm type-check

# テスト（Docker必須）
pnpm test

# データベース操作
pnpm db:generate   # マイグレーション生成
pnpm db:migrate    # マイグレーション実行
pnpm db:studio     # Drizzle Studio起動
```

## エンドポイント

- `http://localhost:3001` - API サーバー
- `http://localhost:3001/health` - ヘルスチェック
- `http://localhost:3001/api/docs` - Swagger UI
- `http://localhost:3001/api/openapi.json` - OpenAPI 仕様書

## ディレクトリ構造

```
src/
├── features/       # 機能別モジュール
│   └── [feature]/
│       ├── route.ts
│       ├── service.ts
│       └── repository.ts
├── db/             # データベース
│   ├── schema/     # Drizzleスキーマ定義
│   └── index.ts    # DB接続
├── handlers/       # 共通ハンドラ
├── middleware/     # ミドルウェア（認証など）
├── lib/            # ライブラリ
├── test-utils/     # テストユーティリティ
└── index.ts        # エントリーポイント
```
