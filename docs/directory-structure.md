# ディレクトリ構成

## ルート

```
remindrop/
├── apps/
│   ├── web/                # Next.js Webアプリ
│   ├── api/                # Hono API
│   └── extension/          # Plasmo ブラウザ拡張（未実装）
├── packages/
│   ├── ui/                 # 共有UIコンポーネント
│   ├── types/              # 共有型定義
│   └── config/             # ESLint/TypeScript設定
├── infra/                  # AWS CDK（未実装）
├── docs/                   # ドキュメント
├── docker-compose.yml      # PostgreSQL
├── turbo.json              # Turborepo設定
└── pnpm-workspace.yaml     # pnpm workspaces
```

---

## apps/web

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 認証ページ
│   └── (app)/              # メインアプリ
├── api/                    # Orval生成APIクライアント（自動生成）
├── components/             # アプリ固有コンポーネント
├── features/               # 機能別モジュール（Bulletproof React）
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       └── index.ts
├── lib/                    # ユーティリティ
├── providers/              # React プロバイダー
└── env.ts                  # 環境変数バリデーション
```

**ルール:**
- features は `index.ts` 経由でのみ公開
- 機能間の依存は最小限に

---

## apps/api

```
apps/api/
├── src/
│   ├── features/           # 機能別モジュール
│   │   └── [feature]/
│   │       ├── route.ts    # APIルート（@hono/zod-openapi）
│   │       ├── service.ts  # ビジネスロジック
│   │       ├── repository.ts
│   │       └── index.ts
│   ├── db/
│   │   └── schema/         # Drizzleテーブル定義
│   ├── middleware/
│   ├── handlers/
│   ├── lib/
│   ├── test-utils/
│   └── index.ts
└── migrations/             # Drizzleマイグレーション
```

---

## packages/ui

```
packages/ui/src/
├── components/             # 共有コンポーネント（shadcn/ui）
├── lib/                    # ユーティリティ
├── styles/                 # グローバルスタイル
└── index.ts
```

---

## packages/types

```
packages/types/src/
├── schemas/                # Zodスキーマ
└── index.ts
```

---

## 環境変数

| ファイル | 用途 |
|---------|------|
| `.env` | Docker Compose用 |
| `apps/web/.env` | Next.js用 |
| `apps/api/.env` | API用 |

---

## パッケージ依存関係

```
apps/web  →  @repo/ui, @repo/types
apps/api  →  @repo/types
```
