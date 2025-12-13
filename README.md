# Remindrop

AI搭載のブックマーク管理アプリ（日次リマインダー付き）

## 概要

モダンなWeb開発を学ぶための個人プロジェクト：
- **フロントエンド**: Next.js 15 (App Router) + React 19 + TypeScript
- **バックエンド**: Hono + @hono/zod-openapi + AWS Lambda + Drizzle ORM
- **データベース**: PostgreSQL (RDS)
- **ブラウザ拡張**: Plasmo
- **インフラ**: AWS CDK
- **AI**: Anthropic Claude Haiku
- **モノレポ**: Turborepo + pnpm 10

## 機能

- 🔖 ブックマーク保存（ブラウザ拡張 or Webアプリ）
- 🤖 AI要約（3行、Claude Haiku使用）
- 🏷️ 自動タグ付け
- 📧 デイリーサマリーメール
- 🔍 全文検索・フィルター
- 📱 レスポンシブUI

## プロジェクト構成

```
remindrop/
├── apps/
│   ├── web/              # Next.js Webアプリ
│   ├── extension/        # Plasmo ブラウザ拡張
│   └── api/              # Hono API (AWS Lambda)
├── packages/
│   ├── ui/               # 共有UIコンポーネント
│   ├── types/            # TypeScript型定義
│   ├── db/               # Drizzleスキーマ
│   ├── config/           # 共通設定
│   └── utils/            # ユーティリティ
├── infra/                # AWS CDK
└── docs/                 # ドキュメント
```

## ドキュメント

- **[要件定義](docs/requirements.md)** - 機能要件
- **[設計](docs/design.md)** - システムアーキテクチャ
- **[タスク](docs/tasks.md)** - 開発ロードマップ
- **[ディレクトリ構成](docs/directory-structure.md)** - プロジェクト構造
- **[AGENTS.md](AGENTS.md)** - AI開発エージェント用指示（Cursor IDE用）

## 開発環境

### 必要なもの

- Node.js 24+
- pnpm 10+
- PostgreSQL
- AWSアカウント
- Anthropic APIキー

### セットアップ

```bash
# PostgreSQLの起動（Docker）
docker run --name remindrop-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=remindrop \
  -p 5432:5432 \
  -d postgres:15

# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env.local
# .env.localに実際の値を入力

# データベースマイグレーション
pnpm db:migrate

# 開発サーバー起動
pnpm dev
# Web: http://localhost:3000
# API: http://localhost:3001
```

**注:** AWS RDSへの移行はPhase 3（デプロイ準備時）に実施

### コマンド

```bash
pnpm dev          # 全アプリ起動
pnpm build        # 全アプリビルド
pnpm lint         # リント
pnpm type-check   # 型チェック
```

## ロードマップ

詳細は [tasks.md](docs/tasks.md) を参照。

**Phase 1-2 (ローカル開発)**
- ✅ 基盤構築
- ⏳ 認証
- ⏳ ブックマークCRUD
- ⏳ 検索機能

**Phase 3 (AWSデプロイ)**
- ⏳ AWS RDS構築
- ⏳ Lambda デプロイ
- ⏳ S3 + CloudFront デプロイ

**Phase 4-7 (機能追加)**
- ⏳ AI統合
- ⏳ ブラウザ拡張
- ⏳ デイリーメール
- ⏳ 仕上げ

**Phase 8+ (今後)**
- タグ管理
- 共有機能
- モバイルアプリ

## ライセンス

MIT - 個人学習用プロジェクト
