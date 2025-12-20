# ディレクトリ構成設計書

## 1. モノレポ構成の選定

### 1.1 モノレポツール: Turborepo + pnpm

**選定理由:**
- **Turborepo**: Vercel製、Next.jsとの親和性が高い、高速キャッシング、並列実行
- **pnpm**: 高速、ディスク効率が良い、workspaces対応、厳格な依存関係管理

**却下した選択肢:**
- Nx: 学習コストが高い、設定が複雑
- Lerna: メンテナンスが停滞、Turborepoより遅い
- npm/yarn workspaces単体: ビルドシステムがない

### 1.2 想定される成長シナリオ

**現在 (MVP):**
- Webアプリ(Next.js)
- ブラウザ拡張(Plasmo)
- バックエンド(Hono)

**将来:**
- モバイルアプリ(React Native/Expo)
- 管理画面(Next.js)
- ランディングページ(Next.js)
- 共有UIライブラリの拡充

---

## 2. ルートディレクトリ構成

```
bookmark-app/                    # モノレポルート
├── .github/                     # GitHub設定
│   ├── workflows/               # GitHub Actions
│   │   ├── ci.yml              # CI (lint, test, build)
│   │   ├── deploy-web.yml      # Web app deploy
│   │   ├── deploy-api.yml      # API deploy
│   │   └── extension.yml       # Extension build/test
│   └── ISSUE_TEMPLATE/         # Issue templates
├── apps/                        # アプリケーション
│   ├── web/                    # Next.js Webアプリ
│   ├── extension/              # Plasmo ブラウザ拡張
│   └── api/                    # Hono API (Lambda)
├── packages/                    # 共有パッケージ
│   ├── ui/                     # 共有UIコンポーネント
│   ├── types/                  # 共有型定義
│   ├── config/                 # 共有設定
│   ├── utils/                  # 共有ユーティリティ
│   └── db/                     # データベーススキーマ・クライアント
├── infra/                       # AWS CDKインフラコード
│   ├── lib/                    # CDK Stack定義
│   ├── bin/                    # CDK App エントリーポイント
│   └── test/                   # インフラテスト
├── docs/                        # ドキュメント
│   ├── requirements.md         # 要件定義
│   ├── design.md               # 設計書
│   ├── tasks.md                # タスク管理
│   ├── api/                    # API仕様
│   └── architecture/           # アーキテクチャ図
├── scripts/                     # ビルド・デプロイスクリプト
│   ├── setup.sh                # 初期セットアップ
│   ├── migrate.sh              # DB migration
│   └── seed.sh                 # DB seed data
├── .gitignore
├── .eslintrc.js                # ルートESLint設定
├── .prettierrc                 # Prettier設定
├── package.json                # ルートpackage.json
├── pnpm-workspace.yaml         # pnpm workspace設定
├── turbo.json                  # Turborepo設定
├── tsconfig.json               # ルートTypeScript設定
└── README.md
```

---

## 3. apps/web (Next.js) - Bulletproof React構成

### 3.1 全体構成

```
apps/web/
├── public/                      # 静的ファイル
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 認証ルートグループ
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (main)/             # メインアプリルートグループ
│   │   │   ├── bookmarks/
│   │   │   │   ├── page.tsx           # 一覧
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # 詳細
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx             # メインレイアウト
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...all]/
│   │   │           └── route.ts       # BetterAuth
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # ホームページ
│   │   ├── loading.tsx         # グローバルローディング
│   │   ├── error.tsx           # グローバルエラー
│   │   └── not-found.tsx       # 404ページ
│   ├── components/             # 共有コンポーネント
│   │   ├── ui/                 # 基本UIコンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   └── index.ts        # Barrel export
│   │   ├── layouts/            # レイアウトコンポーネント
│   │   │   ├── main-layout.tsx
│   │   │   ├── auth-layout.tsx
│   │   │   └── index.ts
│   │   └── providers/          # Providerコンポーネント
│   │       ├── app-provider.tsx
│   │       ├── query-provider.tsx
│   │       └── index.ts
│   ├── features/               # 機能ごとのモジュール (Bulletproof React)
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   ├── login.ts
│   │   │   │   ├── logout.ts
│   │   │   │   ├── signup.ts
│   │   │   │   └── get-session.ts
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── signup-form.tsx
│   │   │   │   ├── oauth-buttons.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   ├── use-login.ts
│   │   │   │   └── index.ts
│   │   │   ├── stores/         # Zustand stores
│   │   │   │   ├── auth-store.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── validators.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts        # Public API
│   │   ├── bookmarks/
│   │   │   ├── api/
│   │   │   │   ├── get-bookmarks.ts
│   │   │   │   ├── get-bookmark.ts
│   │   │   │   ├── create-bookmark.ts
│   │   │   │   ├── update-bookmark.ts
│   │   │   │   ├── delete-bookmark.ts
│   │   │   │   └── index.ts
│   │   │   ├── components/
│   │   │   │   ├── bookmark-card.tsx
│   │   │   │   ├── bookmark-list.tsx
│   │   │   │   ├── bookmark-detail.tsx
│   │   │   │   ├── create-bookmark-button.tsx
│   │   │   │   ├── delete-bookmark-button.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-bookmarks.ts
│   │   │   │   ├── use-bookmark.ts
│   │   │   │   ├── use-create-bookmark.ts
│   │   │   │   └── index.ts
│   │   │   ├── stores/
│   │   │   │   ├── bookmark-filters-store.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── search/
│   │   │   ├── components/
│   │   │   │   ├── search-bar.tsx
│   │   │   │   ├── filter-panel.tsx
│   │   │   │   ├── date-range-filter.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-search.ts
│   │   │   │   └── index.ts
│   │   │   ├── stores/
│   │   │   │   ├── search-store.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── tags/
│   │   │   ├── api/
│   │   │   │   ├── get-tags.ts
│   │   │   │   ├── create-tag.ts
│   │   │   │   ├── delete-tag.ts
│   │   │   │   └── index.ts
│   │   │   ├── components/
│   │   │   │   ├── tag-badge.tsx
│   │   │   │   ├── tag-list.tsx
│   │   │   │   ├── tag-selector.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-tags.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── settings/
│   │       ├── api/
│   │       │   ├── get-settings.ts
│   │       │   ├── update-settings.ts
│   │       │   └── index.ts
│   │       ├── components/
│   │       │   ├── settings-form.tsx
│   │       │   ├── notification-settings.tsx
│   │       │   └── index.ts
│   │       ├── hooks/
│   │       │   ├── use-settings.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── lib/                    # ライブラリ・ユーティリティ
│   │   ├── api-client.ts       # API client (fetch wrapper)
│   │   ├── auth.ts             # BetterAuth設定
│   │   ├── query-client.ts     # React Query設定
│   │   ├── constants.ts        # 定数
│   │   └── utils.ts            # 汎用ユーティリティ
│   ├── hooks/                  # グローバルhooks
│   │   ├── use-media-query.ts
│   │   ├── use-debounce.ts
│   │   └── index.ts
│   ├── stores/                 # グローバルstores
│   │   ├── theme-store.ts
│   │   └── index.ts
│   ├── styles/                 # グローバルスタイル
│   │   ├── globals.css
│   │   └── themes.css
│   ├── types/                  # グローバル型定義
│   │   ├── index.ts
│   │   └── env.d.ts
│   └── config/                 # アプリ設定
│       ├── site.ts             # サイト設定
│       └── env.ts              # 環境変数
├── .env.local                  # ローカル環境変数
├── .env.example                # 環境変数サンプル
├── .eslintrc.js
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### 3.2 Bulletproof React の原則

#### 3.2.1 フィーチャーベースアーキテクチャ

**原則:**
- 各featureは独立したモジュール
- feature内部で完結する構成
- 他のfeatureに依存しない(依存する場合は慎重に)

**例: features/bookmarks/index.ts**
```typescript
// Public API - 外部に公開するもののみexport
export { BookmarkList } from './components/bookmark-list';
export { BookmarkCard } from './components/bookmark-card';
export { useBookmarks } from './hooks/use-bookmarks';
export { useCreateBookmark } from './hooks/use-create-bookmark';

// 内部実装は非公開
// - components/bookmark-list-item.tsx
// - utils/format-date.ts
```

#### 3.2.2 単方向データフロー

```
shared (components, lib, hooks)
  ↓
features (auth, bookmarks, tags)
  ↓
app (pages, layouts)
```

**ESLintで強制:**
```javascript
// .eslintrc.js
'import/no-restricted-paths': [
  'error',
  {
    zones: [
      // features → shared OK
      {
        target: './src/features',
        from: './src/app',
        message: 'Features cannot import from app'
      },
      // shared → features NG
      {
        target: './src/components',
        from: './src/features',
        message: 'Shared components cannot import from features'
      }
    ]
  }
]
```

#### 3.2.3 Barrel Exportsの活用

各ディレクトリに`index.ts`を配置して、公開APIを明確化:

```typescript
// features/bookmarks/index.ts
export * from './components';
export * from './hooks';
export * from './types';
// api, stores, utilsは内部実装として非公開
```

---

## 4. apps/extension (Plasmo) 構成

```
apps/extension/
├── src/
│   ├── background/             # バックグラウンドスクリプト
│   │   └── index.ts
│   ├── contents/               # コンテンツスクリプト
│   │   └── overlay.tsx
│   ├── popup/                  # ポップアップUI
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── clip-button.tsx
│   │   │   ├── status-display.tsx
│   │   │   └── index.ts
│   │   └── hooks/
│   │       ├── use-clip.ts
│   │       └── index.ts
│   ├── options/                # 設定ページ
│   │   └── index.tsx
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── storage.ts          # Chrome storage wrapper
│   │   └── constants.ts
│   ├── styles/
│   │   └── global.css
│   └── types/
│       └── index.ts
├── assets/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── .env.example
├── package.json
├── plasmo.config.ts
├── tsconfig.json
└── README.md
```

**重要な設計方針:**
- `@repo/types`パッケージを使って型を共有
- `@repo/ui`は使わない(Chrome拡張のバンドルサイズ削減)
- APIクライアントは独自実装(軽量化)

---

## apps/api - Hono + OpenAPI構成

```
apps/api/
├── src/
│   ├── routes/                 # OpenAPIルート定義
│   │   ├── bookmarks.ts        # createRoute() + OpenAPIHono
│   │   ├── tags.ts
│   │   ├── auth.ts
│   │   ├── settings.ts
│   │   └── index.ts            # ルート集約
│   ├── schemas/                # Zodスキーマ（OpenAPI用）
│   │   ├── bookmark.ts
│   │   ├── tag.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── services/               # ビジネスロジック
│   │   ├── bookmark-service.ts
│   │   ├── llm-service.ts
│   │   ├── scraping-service.ts
│   │   ├── email-service.ts
│   │   └── index.ts
│   ├── middleware/             # ミドルウェア
│   │   ├── auth.ts
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── db.ts              # Drizzleクライアント
│   │   ├── anthropic.ts       # Anthropic APIクライアント
│   │   ├── ses.ts             # Amazon SESクライアント
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   └── index.ts
│   ├── config/
│   │   └── env.ts             # 環境変数
│   ├── lib/
│   │   └── auth.ts            # Better Auth設定
│   ├── index.ts               # OpenAPIHono app + Scalar
│   └── daily-summary.ts       # デイリーサマリーLambda
├── package.json
└── tsconfig.json
```

**重要な実装パターン:**
```typescript
// src/index.ts
import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import bookmarks from './routes/bookmarks';
import authRoutes from './routes/auth';

const app = new OpenAPIHono();

app.route('/api/bookmarks', bookmarks);
app.route('/api/auth', authRoutes);

// OpenAPI仕様書
app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: { version: '1.0.0', title: 'Remindrop API' },
});

// Scalar API Reference (Better Auth統合)
app.get('/api/docs', Scalar({
  pageTitle: 'Remindrop API Documentation',
  sources: [
    { url: '/api/openapi.json', title: 'Remindrop API' },
    { url: '/api/auth/open-api/generate-schema', title: 'Authentication' },
  ],
}));
```

**Better Auth統合:**
```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { openAPI } from 'better-auth/plugins';

export const auth = betterAuth({
  // ... 設定
  plugins: [
    openAPI(), // OpenAPIプラグインを有効化
  ],
});
```

---

## packages/ - 共有パッケージ

### 6.1 packages/ui

**shadcn/ui + Tailwind CSS v4**を使用した共有UIコンポーネントライブラリ。

```
packages/ui/
├── src/
│   ├── components/             # shadcn/ui コンポーネント
│   │   ├── button.tsx          # @repo/ui/components/button
│   │   ├── input.tsx           # @repo/ui/components/input
│   │   ├── card.tsx            # @repo/ui/components/card
│   │   ├── dialog.tsx
│   │   ├── label.tsx
│   │   ├── separator.tsx
│   │   └── badge.tsx
│   ├── hooks/                  # UI関連hooks
│   │   ├── use-toast.ts
│   │   └── index.ts
│   ├── lib/                    # ユーティリティ
│   │   ├── utils.ts            # @repo/ui/lib/utils (cn関数など)
│   │   └── index.ts
│   └── styles/
│       └── globals.css         # @repo/ui/globals.css (Tailwind v4設定)
├── components.json             # shadcn/ui 設定
├── postcss.config.mjs          # PostCSS設定 (@tailwindcss/postcss)
├── tsconfig.json
└── package.json
```

**特徴:**
- **shadcn/ui**: コピー可能なコンポーネント（依存ではなくコード）
- **Tailwind v4**: `@source`ディレクティブでcontent自動検出
- **next-themes**: ダークモード対応
- **lucide-react**: アイコンライブラリ
- **tw-animate-css**: アニメーション（Tailwind v4対応）

**使用例:**
```typescript
// apps/web/src/app/page.tsx
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { cn } from '@repo/ui/lib/utils';
```

**shadcn CLIでコンポーネント追加:**
```bash
cd apps/web
npx shadcn@latest add button
# → packages/ui/src/components/button.tsx に自動配置
```
│   ├── styles/
│   │   └── globals.css
│   └── index.ts                # Public API
├── package.json
├── tsconfig.json
└── README.md
```

### 6.2 packages/types

```
packages/types/
├── src/
│   ├── api/                    # API型定義
│   │   ├── bookmarks.ts
│   │   ├── tags.ts
│   │   ├── auth.ts
│   │   ├── settings.ts
│   │   └── index.ts
│   ├── models/                 # モデル型定義
│   │   ├── user.ts
│   │   ├── bookmark.ts
│   │   ├── tag.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 6.3 packages/db

```
packages/db/
├── src/
│   ├── schema/                 # Drizzle schema
│   │   ├── users.ts
│   │   ├── bookmarks.ts
│   │   ├── tags.ts
│   │   ├── settings.ts
│   │   └── index.ts
│   ├── migrations/             # マイグレーションファイル
│   ├── client.ts               # DB client
│   └── index.ts
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

### 6.4 packages/config

```
packages/config/
├── eslint/
│   ├── base.js
│   ├── next.js
│   ├── react.js
│   └── node.js
├── typescript/
│   ├── base.json
│   ├── next.json
│   └── node.json
└── package.json
```

### 6.5 packages/utils

```
packages/utils/
├── src/
│   ├── string/
│   │   ├── truncate.ts
│   │   ├── slugify.ts
│   │   └── index.ts
│   ├── date/
│   │   ├── format.ts
│   │   ├── relative.ts
│   │   └── index.ts
│   ├── validation/
│   │   ├── url.ts
│   │   ├── email.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

## 7. 設定ファイル

### 7.1 pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'infra'
```

### 7.2 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### 7.3 package.json (root)

```json
{
  "name": "bookmark-app",
  "private": true,
  "version": "1.0.0",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "turbo dev --parallel",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "prettier": "^3.1.0",
    "turbo": "^1.11.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 8. 追加の考慮事項

### 8.1 絶対インポートの設定

**apps/web/tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

**使用例:**
```typescript
// ❌ 相対パス
import { Button } from '../../../components/ui/button';

// ✅ 絶対パス
import { Button } from '@/components/ui/button';
```

### 8.2 型安全なAPIクライアント

**検討事項:**
- **tRPC**: 型安全なAPI通信、エンドツーエンドの型推論
- **zodスキーマ**: リクエスト/レスポンスのバリデーション

**現時点の判断:**
- MVP段階では通常のfetch + zodバリデーションで十分
- 将来的にtRPC導入を検討

### 8.3 Storybook

**検討:**
- UIコンポーネントのカタログ化
- packages/ui にStorybookを追加

**現時点の判断:**
- MVP段階では不要(個人開発)
- チーム開発時に追加を検討

### 8.4 テスト戦略

```
apps/web/
├── __tests__/                  # E2Eテスト
│   ├── bookmarks.spec.ts
│   └── auth.spec.ts
└── src/
    └── features/
        └── bookmarks/
            └── components/
                ├── bookmark-card.tsx
                └── bookmark-card.test.tsx  # Unitテスト
```

**テストツール:**
- **Unit**: Vitest + React Testing Library
- **E2E**: Playwright

**現時点の判断:**
- MVP段階では手動テストで十分
- Phase 5で基本的なE2Eテストを追加

### 8.5 環境変数管理

**ルール:**
- `.env.example`を各アプリに配置
- `.env.local`はgitignore
- Turborepoの`globalDependencies`に`.env.*local`を追加

**apps/web/.env.example:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3001
```

### 8.6 コード品質管理

**Husky + lint-staged:**
```json
// package.json (root)
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

**commitlint:**
```
# Conventional Commits
feat: 新機能
fix: バグ修正
docs: ドキュメント
refactor: リファクタリング
test: テスト
chore: その他
```

### 8.7 CI/CDパイプライン

**GitHub Actions戦略:**

1. **CI Pipeline** (.github/workflows/ci.yml)
   - lint, type-check, test
   - Turborepoキャッシュ活用

2. **Deploy Web** (.github/workflows/deploy-web.yml)
   - S3 + CloudFrontへデプロイ
   - プレビュー環境(PRごと)

3. **Deploy API** (.github/workflows/deploy-api.yml)
   - AWS CDK deploy
   - dev/prod環境分離

4. **Extension** (.github/workflows/extension.yml)
   - ビルド・テスト
   - Chrome Web Store自動公開(将来)

---

## 9. マイグレーション戦略

### 9.1 フェーズ1: 基本構成

1. モノレポセットアップ
2. Next.js (bulletproof-react構成)
3. Plasmo extension
4. Hono API

### 9.2 フェーズ2: 共有パッケージ

1. packages/typesに型定義を抽出
2. packages/dbにDBスキーマを抽出
3. packages/uiに共通コンポーネントを抽出

### 9.3 フェーズ3: 最適化

1. Turborepoキャッシュ最適化
2. CI/CD整備
3. テスト追加

---

## 10. 開発体験の向上

### 10.1 VS Code設定

**.vscode/settings.json:**
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### 10.2 推奨拡張機能

**.vscode/extensions.json:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright"
  ]
}
```

### 10.3 デバッグ設定

**.vscode/launch.json:**
```json
{
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev --filter web"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

---

## 11. FAQ

### Q1: なぜTurborepoを選んだのか？

**A:** 
- Next.jsとの親和性が高い
- 設定がシンプル
- キャッシングが高速
- Vercelのサポートが手厚い

### Q2: なぜpnpmを選んだのか？

**A:**
- npm/yarnより高速
- ディスク効率が良い(シンボリックリンク)
- workspacesの管理が厳格
- Turborepoと相性が良い

### Q3: packages/uiとapps/web/src/components/の使い分けは？

**A:**
- **packages/ui**: 複数アプリで使う汎用UIコンポーネント（shadcn/uiコンポーネント）
  - Button, Card, Input, Dialog等の基本UIコンポーネント
  - ブラウザ拡張、モバイルアプリでも使用可能
- **apps/web/src/components/**: Webアプリ専用のコンポーネント
  - レイアウトコンポーネント（MainLayout, AuthLayout）
  - Providerコンポーネント（AppProvider, QueryProvider）

**shadcn/ui採用により:**
- `packages/ui`にshadcn/uiコンポーネントを配置
- shadcn CLIで自動的に`packages/ui`に追加される
- アプリ固有のコンポーネントは各app内に配置

### Q4: features/とcomponents/の使い分けは？

**A:**
- **features/**: ビジネスロジックを持つ機能モジュール(bookmarks, auth等)
- **components/**: ビジネスロジックを持たないUIコンポーネント(Button, Card等)

### Q5: APIクライアントはどこに配置？

**A:**
- **apps/web/src/features/*/api/**: feature固有のAPIクライアント
- **apps/web/src/lib/api-client.ts**: 共通のfetch wrapper
- **apps/extension/src/lib/api-client.ts**: 拡張機能用(軽量化のため独立)

---

作成日: 2024-12-13
バージョン: 1.0
