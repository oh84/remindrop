# Remindrop Web Application

Next.js 15 + React 19 + TypeScript + TailwindCSS

**重要:** Static Export モード（SSR/ISR/Middleware/API Routes は使用不可）

## Directory Structure

```
src/
├── app/              # Next.js App Router pages
├── api/              # Orval生成APIクライアント（自動生成）
├── components/       # アプリ固有コンポーネント
├── features/         # 機能別モジュール（Bulletproof React）
├── lib/              # ユーティリティ（auth-client等）
├── providers/        # React プロバイダー（Query、Theme）
└── env.ts            # 環境変数バリデーション
```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## API Client Generation

OpenAPI仕様書からOrvalで型安全なAPIクライアントを自動生成：

```bash
pnpm orval:generate
```

生成されたクライアントは `src/api/` に出力されます。
