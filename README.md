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
- Docker & Docker Compose
- AWSアカウント（Phase 3以降）
- Anthropic APIキー（Phase 4以降）

### セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd remindrop

# 環境変数の設定
cp .env.example .env                           # Docker Compose用
cp apps/web/.env.example apps/web/.env         # Next.js用
cp apps/api/.env.example apps/api/.env         # API用

# 依存関係のインストール
pnpm install

# PostgreSQL起動
pnpm db:up

# データベースマイグレーション
pnpm -F api db:migrate

# 開発サーバー起動
pnpm dev
# Web: http://localhost:3000
# API: http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

**注:** 
- 初回セットアップ時は `pnpm db:up` でPostgreSQLを起動してください
- 以降、`pnpm dev` はPostgreSQLコンテナを自動チェック・起動します
- AWS RDSへの移行はPhase 3（デプロイ準備時）に実施

### コマンド

```bash
# 開発
pnpm dev          # 全アプリ起動（PostgreSQL自動起動）
pnpm build        # 全アプリビルド
pnpm lint         # リント
pnpm type-check   # 型チェック
pnpm format       # コード整形

# データベース
pnpm db:up        # PostgreSQL起動のみ
pnpm db:down      # PostgreSQL停止
pnpm db:reset     # PostgreSQLリセット（データ削除）
```

## ロードマップ

詳細は [tasks.md](docs/tasks.md) を参照。

**Phase 1-2 (ローカル開発)**
- ✅ モノレポ基盤構築
- ✅ Next.js Webアプリ + shadcn/ui
- ✅ Hono API + OpenAPI
- ✅ Drizzle ORM + PostgreSQL
- ⏳ 認証（BetterAuth）
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
