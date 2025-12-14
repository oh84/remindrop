# Hono API Server

Remindrop のバックエンド API サーバー。

## 技術スタック

- **Hono**: 軽量で高速な Web フレームワーク
- **@hono/zod-openapi**: OpenAPI 仕様の自動生成
- **Zod**: スキーマバリデーション
- **TypeScript**: 型安全な開発

## 開発

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# 型チェック
pnpm type-check
```

## エンドポイント

- `http://localhost:3001` - API サーバー
- `http://localhost:3001/health` - ヘルスチェック
- `http://localhost:3001/api/docs` - Swagger UI
- `http://localhost:3001/api/openapi.json` - OpenAPI 仕様書

## ディレクトリ構造

```
src/
├── routes/         # OpenAPI ルート定義
├── schemas/        # Zod スキーマ
├── services/       # ビジネスロジック
├── middleware/     # ミドルウェア
├── lib/            # ライブラリ
└── index.ts        # エントリーポイント
```
