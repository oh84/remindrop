# ディレクトリ構成設計書

## 1. ルートディレクトリ構成

```
remindrop/                       # モノレポルート
├── apps/                        # アプリケーション
│   ├── web/                    # Next.js Webアプリ
│   ├── api/                    # Hono API (Lambda)
│   └── extension/              # Plasmo ブラウザ拡張 (Phase 5)
├── packages/                    # 共有パッケージ
│   ├── ui/                     # 共有UIコンポーネント (shadcn/ui)
│   ├── db/                     # Drizzle ORM スキーマ
│   ├── types/                  # TypeScript型定義
│   ├── utils/                  # ユーティリティ関数
│   └── config/                 # ESLint/TypeScript設定
├── infra/                       # AWS CDKインフラコード (Phase 3)
├── docs/                        # ドキュメント
│   ├── requirements.md         # 要件定義
│   ├── design.md               # システム設計
│   ├── tasks.md                # タスク管理
│   └── directory-structure.md  # このファイル
├── .env                         # 環境変数 (Docker Compose用)
├── .env.example                 # 環境変数サンプル
├── docker-compose.yml           # PostgreSQL設定
├── turbo.json                   # Turborepo設定
├── pnpm-workspace.yaml          # pnpm workspaces設定
├── package.json                 # ルートpackage.json
└── README.md
```

---

## 2. apps/web (Next.js) - Bulletproof React構成

### 2.1 全体構成

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 認証ルートグループ
│   │   ├── (app)/              # メインアプリルートグループ
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # アプリケーション固有のコンポーネント
│   │   ├── ui/                 # shadcn/ui (カスタマイズ可能)
│   │   ├── layout/
│   │   └── providers/
│   ├── features/               # 機能ごとのモジュール (Bulletproof React)
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   └── index.ts        # Public API
│   │   ├── bookmarks/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── search/
│   │   └── tags/
│   ├── lib/                    # ユーティリティ
│   ├── hooks/                  # グローバルhooks
│   ├── styles/
│   └── env.ts                  # 環境変数バリデーション
├── .env
└── package.json
```

### 2.2 Bulletproof React の原則

#### 2.2.1 Feature-based Structure

**原則:**
- 各featureは独立したモジュール
- feature内部で完結する構成
- 他のfeatureに依存しない(依存する場合は慎重に)
- 公開するAPIは`index.ts`で明示的にexport

**例: features/bookmarks/index.ts**
```typescript
// Public API - 外部に公開するもののみexport
export { BookmarkList } from './components/bookmark-list';
export { BookmarkCard } from './components/bookmark-card';
export { useBookmarks } from './hooks/use-bookmarks';
export { useCreateBookmark } from './hooks/use-create-bookmark';
export type { Bookmark } from './types';

// 内部実装は非公開
```

#### 2.2.2 Colocation

関連するファイルは近くに配置:
- コンポーネントとそのテスト
- hooksとその使用例
- APIクライアントと型定義

#### 2.2.3 Separation of Concerns

- **api/**: バックエンドとの通信ロジック
- **components/**: UIコンポーネント
- **hooks/**: ビジネスロジック、状態管理
- **types/**: TypeScript型定義

#### 2.2.4 コンポーネント配置ルール

- **アプリ固有のコンポーネント**: `apps/web/src/components/`
- **複数アプリで共有**: `packages/ui/src/components/`
- **shadcn/ui コンポーネント**: `apps/web/src/components/ui/` (カスタマイズ可能)

---

## 3. apps/api (Hono)

### 3.1 全体構成

```
apps/api/
├── src/
│   ├── routes/                  # APIルート
│   │   ├── health.ts           # ヘルスチェック
│   │   ├── auth.ts             # 認証 (Better Auth)
│   │   ├── bookmarks.ts        # ブックマークCRUD
│   │   ├── tags.ts             # タグCRUD
│   │   └── search.ts           # 検索
│   ├── lib/                     # ライブラリ
│   │   ├── auth.ts             # Better Auth設定
│   │   └── utils.ts
│   ├── middleware/              # ミドルウェア
│   │   ├── error-handler.ts    # エラーハンドリング
│   │   ├── auth.ts             # 認証ミドルウェア
│   │   └── logger.ts           # ロガー
│   ├── types/                   # 型定義
│   │   └── index.ts
│   ├── env.ts                   # 環境変数バリデーション (Zod)
│   └── index.ts                 # エントリーポイント
├── .env                         # 環境変数
├── .env.example                 # 環境変数サンプル
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### 3.2 ルート設計

**OpenAPI準拠:**
- `@hono/zod-openapi`を使用
- 各ルートでスキーマ定義
- Scalar UIで自動ドキュメント生成

**例: routes/bookmarks.ts**
```typescript
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

const BookmarkSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string().url(),
  // ...
});

const route = createRoute({
  method: 'get',
  path: '/bookmarks',
  summary: 'Get all bookmarks',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(BookmarkSchema),
        },
      },
      description: 'Success',
    },
  },
});

export default new OpenAPIHono().openapi(route, async (c) => {
  // 実装
});
```

---

## 4. packages/db (Drizzle ORM)

### 4.1 全体構成

```
packages/db/
├── src/
│   ├── schema/                  # テーブル定義
│   │   ├── users.ts
│   │   ├── sessions.ts         # Better Auth用
│   │   ├── accounts.ts         # Better Auth用
│   │   ├── verification-tokens.ts  # Better Auth用
│   │   ├── bookmarks.ts
│   │   ├── tags.ts
│   │   ├── bookmark-tags.ts
│   │   └── index.ts            # スキーマエクスポート
│   └── index.ts                 # DB接続・エクスポート
├── migrations/                  # マイグレーションファイル
│   └── 0000_*.sql
├── .env                         # 環境変数
├── .env.example                 # 環境変数サンプル
├── drizzle.config.ts            # Drizzle Kit設定
├── package.json
├── tsconfig.json
└── test-connection.ts           # 接続テスト
```

### 4.2 スキーマ設計原則

**Better Auth統合:**
- `users`, `sessions`, `accounts`, `verification_tokens`テーブルはBetter Authの要件に準拠
- カスタムフィールドは`users`テーブルに追加可能

**リレーション:**
```
users (1) ──< (N) bookmarks
bookmarks (N) ──< (N) tags (through bookmark_tags)
```

**例: schema/bookmarks.ts**
```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## 5. packages/ui (共有UIコンポーネント)

### 5.1 全体構成

```
packages/ui/
├── src/
│   ├── components/              # 共有コンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── index.ts
│   ├── hooks/                   # 共有hooks
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

### 5.2 配置ルール

**このパッケージに配置:**
- 複数アプリで共有するコンポーネント
- デザインシステムの基盤コンポーネント

**配置しない:**
- アプリ固有のロジックを持つコンポーネント → `apps/web/src/components/`
- shadcn/uiコンポーネント → `apps/web/src/components/ui/`

---

## 6. packages/types (共有型定義)

### 6.1 全体構成

```
packages/types/
├── src/
│   ├── api/                     # API型定義
│   │   ├── bookmark.ts
│   │   ├── tag.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── common/                  # 共通型
│   │   ├── pagination.ts
│   │   ├── error.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 6.2 型定義の原則

**Single Source of Truth:**
- APIのレスポンス型はここで定義
- データベーススキーマから型を生成する場合は`@repo/db`から再エクスポート

**例: api/bookmark.ts**
```typescript
export type Bookmark = {
  id: string;
  userId: string;
  url: string;
  title: string;
  summary?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateBookmarkInput = Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBookmarkInput = Partial<CreateBookmarkInput>;
```

---

## 7. packages/utils (共有ユーティリティ)

### 7.1 全体構成

```
packages/utils/
├── src/
│   ├── date.ts                  # 日付処理
│   ├── string.ts                # 文字列処理
│   ├── url.ts                   # URL処理
│   ├── validation.ts            # バリデーション
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 7.2 配置ルール

**このパッケージに配置:**
- 複数アプリで共有する純粋関数
- フレームワーク非依存のロジック

**配置しない:**
- React hooks → `@repo/ui` or アプリ固有の`hooks/`
- APIクライアント → 各アプリの`lib/`

---

## 8. 環境変数管理

### 8.1 環境変数ファイルの配置

各パッケージは独自の`.env`ファイルを持ちます:
- ルート/.env (Docker Compose用)
- apps/web/.env
- apps/api/.env
- packages/db/.env

### 8.2 環境変数バリデーション

**Zodスキーマによる検証:**
- `apps/web/src/env.ts` - Next.js環境変数
- `apps/api/src/env.ts` - API環境変数
- 起動時に自動検証、エラー時は詳細なメッセージ表示

**例: apps/api/src/env.ts**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_URL: z.string().url(),
  API_PORT: z.string().transform(Number).pipe(z.number().positive()),
  BETTER_AUTH_SECRET: z.string().min(32),
  WEB_URL: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
```

### 8.3 環境変数読み込み方法

- **開発時**: `tsx --env-file=.env` でスクリプト実行
- **Next.js**: 自動で`.env`ファイルを読み込み
- **Drizzle Kit**: `drizzle.config.ts`内で`process.loadEnvFile('.env')`

---

## 9. パッケージ間の依存関係

```
apps/web
  ├─→ @repo/ui
  ├─→ @repo/types
  └─→ @repo/utils

apps/api
  ├─→ @repo/db
  ├─→ @repo/types
  └─→ @repo/utils

packages/db
  └─→ @repo/types

packages/ui
  └─→ @repo/utils
```

**依存関係のルール:**
- 循環依存の禁止
- `@repo/config`はすべてのパッケージから参照可能
- アプリ間の直接依存は禁止

---

## 10. 開発ワークフロー

### 10.1 初期セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd remindrop

# 環境変数の設定
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
cp packages/db/.env.example packages/db/.env

# 依存関係のインストール
pnpm install

# PostgreSQL起動
pnpm db:up

# データベースマイグレーション
cd packages/db
pnpm db:migrate
cd ../..

# 開発サーバー起動
pnpm dev
```

### 10.2 日常的な開発

```bash
# 開発サーバー起動（PostgreSQL自動起動）
pnpm dev

# ビルド
pnpm build

# リント・型チェック
pnpm lint
pnpm type-check

# テスト
pnpm test

# データベース操作
pnpm db:studio          # Drizzle Studio起動
pnpm db:push            # スキーマ適用（開発時）
pnpm db:generate        # マイグレーションファイル生成
pnpm db:migrate         # マイグレーション実行
```

### 10.3 新機能追加の流れ

1. **DBスキーマ定義** (`packages/db/src/schema/`)
2. **マイグレーション生成** (`pnpm db:generate`)
3. **型定義** (`packages/types/src/`)
4. **APIルート実装** (`apps/api/src/routes/`)
5. **Webフロントエンド実装**:
   - feature作成 (`apps/web/src/features/`)
   - APIクライアント (`feature/api/`)
   - hooks (`feature/hooks/`)
   - コンポーネント (`feature/components/`)
   - ページ追加 (`apps/web/src/app/`)

---

## 11. 技術スタック

### 11.1 フロントエンド
- **Next.js 15**: App Router、React Server Components
- **React 19**: 最新機能活用
- **TypeScript**: 型安全性
- **Tailwind CSS v4**: スタイリング
- **shadcn/ui**: UIコンポーネント

### 11.2 バックエンド
- **Hono**: 高速軽量フレームワーク
- **@hono/zod-openapi**: OpenAPI準拠のAPI設計
- **Drizzle ORM**: 型安全なORM
- **Better Auth**: 認証ライブラリ
- **PostgreSQL**: データベース

### 11.3 開発ツール
- **Turborepo**: モノレポビルドシステム
- **pnpm**: パッケージマネージャー
- **Vitest**: テストフレームワーク
- **ESLint**: リンター
- **Zod**: スキーマバリデーション

---

## 12. 今後の拡張予定

### Phase 3: AWS デプロイ
- **RDS**: PostgreSQL本番環境
- **Lambda**: API実行環境
- **S3 + CloudFront**: 静的ファイル配信

### Phase 5: ブラウザ拡張
```
apps/extension/
├── src/
│   ├── popup/              # ポップアップUI
│   ├── content/            # コンテンツスクリプト
│   ├── background/         # バックグラウンドスクリプト
│   └── shared/             # 共有ロジック
```

### Phase 8+: 将来的な追加機能
- **モバイルアプリ** (`apps/mobile/` - React Native/Expo)
- **管理画面** (`apps/admin/` - Next.js)
- **ランディングページ** (`apps/landing/` - Next.js)

---

詳細な設計については各ドキュメントを参照してください:
- [要件定義](requirements.md)
- [システム設計](design.md)
- [タスク管理](tasks.md)
