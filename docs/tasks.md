# 開発タスク

**アプリケーション名:** Remindrop

> **📝 このドキュメントの更新タイミング**
> - タスクを完了したとき（チェックボックスにチェック）
> - 新しいタスクが発見されたとき
> - タスクの優先順位が変わったとき

---

## Phase 1: 基盤構築

### Task 1.0: ローカル開発環境セットアップ
- [ ] Docker PostgreSQL起動
  ```bash
  docker run --name remindrop-postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=remindrop \
    -p 5432:5432 \
    -d postgres:15
  ```
- [ ] .env.local作成（.env.exampleからコピー）
- [ ] データベース接続確認

### Task 1.1: モノレポ初期化
- [ ] pnpm workspaceセットアップ
- [ ] Turborepo設定
- [ ] ルートpackage.json作成
- [ ] .gitignore設定

### Task 1.2: 共有パッケージのセットアップ
- [ ] packages/types 作成
- [ ] packages/config 作成（ESLint, TypeScript）
- [ ] packages/utils 作成

### Task 1.3: データベースセットアップ
- [ ] Drizzle ORM セットアップ
- [ ] packages/db 作成
- [ ] ローカルPostgreSQL接続確認
- [ ] 環境変数設定（DATABASE_URL）

**注:** AWS RDS構築はPhase 3（デプロイ準備時）に実施

### Task 1.4: Next.js Webアプリセットアップ
- [ ] apps/web 作成（Next.js 15）
- [ ] TailwindCSS設定
- [ ] TypeScript設定
- [ ] ディレクトリ構造作成（Bulletproof React）

### Task 1.5: Hono APIセットアップ
- [ ] apps/api 作成
- [ ] Hono セットアップ
- [ ] ローカルサーバー設定（@hono/node-server）
- [ ] http://localhost:3001 で起動確認
- [ ] ディレクトリ構造作成
- [ ] 基本的なルート作成（health check）

**注:** AWS Lambda設定・デプロイはPhase 3以降

---

## Phase 2: コア機能実装

### Task 2.1: データベーススキーマ定義
- [ ] Drizzle ORM セットアップ
- [ ] packages/db 作成
- [ ] Userスキーマ定義
- [ ] Bookmarkスキーマ定義
- [ ] Tagスキーマ定義
- [ ] リレーション定義
- [ ] マイグレーション生成・実行

### Task 2.2: 認証機能
- [ ] BetterAuth セットアップ
- [ ] メール/パスワード認証実装
- [ ] セッション管理
- [ ] ログイン/サインアップUI
- [ ] 認証ミドルウェア（API）
- [ ] 保護ルート設定（Web）

### Task 2.3: ブックマークCRUD API
- [ ] OpenAPI スキーマ定義（Zod）
- [ ] POST /api/bookmarks（作成）- createRoute
- [ ] GET /api/bookmarks（一覧取得）- createRoute
- [ ] GET /api/bookmarks/:id（詳細取得）- createRoute
- [ ] PATCH /api/bookmarks/:id（更新）- createRoute
- [ ] DELETE /api/bookmarks/:id（削除）- createRoute
- [ ] バリデーション（Zod schemas）
- [ ] エラーハンドリング
- [ ] OpenAPI仕様書の確認（/api/docs）

### Task 2.4: ブックマーク一覧画面
- [ ] React Query セットアップ
- [ ] BookmarkCard コンポーネント
- [ ] BookmarkList コンポーネント
- [ ] ページネーション
- [ ] ローディング状態
- [ ] エラー状態

### Task 2.5: ブックマーク作成・編集画面
- [ ] BookmarkForm コンポーネント
- [ ] バリデーション（Zod）
- [ ] 楽観的更新（React Query）
- [ ] トースト通知

### Task 2.6: 検索・フィルター機能
- [ ] 検索API実装
- [ ] 全文検索（PostgreSQL）
- [ ] タグフィルター
- [ ] 日付フィルター
- [ ] ソート機能
- [ ] URLパラメータ管理

---

## Phase 3: AWS デプロイ準備

### Task 3.0: AWS CDKセットアップ
- [ ] infra/ ディレクトリ作成
- [ ] CDK プロジェクト初期化
- [ ] 必要なCDKライブラリインストール
  - @aws-cdk/aws-rds
  - @aws-cdk/aws-lambda
  - @aws-cdk/aws-apigatewayv2
  - @aws-cdk/aws-s3
  - @aws-cdk/aws-cloudfront
  - @aws-cdk/aws-events
  - @aws-cdk/aws-ses

### Task 3.1: AWS RDS構築
- [ ] VPC作成
- [ ] セキュリティグループ設定
- [ ] RDS PostgreSQL (db.t4g.micro) 作成
- [ ] パラメータグループ設定
- [ ] 接続確認
- [ ] ローカルDBからマイグレーション

### Task 3.2: Hono API Lambda デプロイ
- [ ] Lambda関数ハンドラー作成
- [ ] API Gateway設定
- [ ] 環境変数設定
- [ ] デプロイ
- [ ] 動作確認

### Task 3.3: Next.js S3 + CloudFrontデプロイ
- [ ] S3バケット作成（静的ホスティング）
- [ ] CloudFront ディストリビューション作成
- [ ] Next.js static export設定
- [ ] ビルド & デプロイスクリプト
- [ ] 環境変数設定
- [ ] カスタムドメイン設定（オプション）

---

## Phase 4: AI統合

### Task 4.1: Anthropic API統合
- [ ] Anthropic SDK セットアップ
- [ ] APIクライアント作成
- [ ] エラーハンドリング
- [ ] レート制限管理

### Task 7.2: 要約生成機能
- [ ] 要約生成サービス実装
- [ ] POST /api/bookmarks/:id/summarize
- [ ] プロンプト最適化
- [ ] 要約結果の保存

### Task 7.3: タグ自動生成
- [ ] タグ生成サービス実装
- [ ] POST /api/bookmarks/:id/generate-tags
- [ ] タグの自動適用

### Task 7.4: UI統合
- [ ] 要約ボタン追加
- [ ] タグ生成ボタン追加
- [ ] ローディング状態
- [ ] エラー表示

---

## Phase 5: ブラウザ拡張機能

### Task 5.1: Plasmoプロジェクトセットアップ
- [ ] apps/extension 作成
- [ ] Manifest設定
- [ ] アイコン・画像追加

### Task 7.2: コンテンツスクリプト
- [ ] ページ情報取得（URL, タイトル）
- [ ] メタデータ抽出
- [ ] API通信

### Task 7.3: ポップアップUI
- [ ] 簡易保存フォーム
- [ ] タグ選択
- [ ] 保存確認

### Task 7.4: バックグラウンドスクリプト
- [ ] コンテキストメニュー
- [ ] ショートカットキー
- [ ] 認証トークン管理

### Task 5.5: 拡張機能デプロイ
- [ ] Chrome Web Store登録準備
- [ ] ビルド最適化
- [ ] テスト

---

## Phase 6: デイリーサマリー

### Task 6.1: EventBridge設定
- [ ] 毎朝7時のスケジュール設定
- [ ] Lambda関数トリガー

### Task 7.2: サマリー生成Lambda
- [ ] 過去24時間のブックマーク取得
- [ ] メール本文生成
- [ ] HTML/テキスト形式

### Task 7.3: Amazon SES統合
- [ ] SES設定（送信元メール検証）
- [ ] メール送信実装
- [ ] テンプレート作成

### Task 7.4: ユーザー設定
- [ ] サマリー受信設定UI
- [ ] 送信時刻設定
- [ ] 受信頻度設定（毎日/週次）
- [ ] オプトアウト機能

---

## Phase 7: 仕上げ・改善

### Task 7.1: エラーハンドリング強化
- [ ] グローバルエラーバウンダリ
- [ ] API エラーハンドリング統一
- [ ] ユーザーフレンドリーなエラーメッセージ
- [ ] ロギング（CloudWatch）

### Task 7.2: パフォーマンス最適化
- [ ] Next.js ビルド最適化
- [ ] 画像最適化
- [ ] バンドルサイズ削減
- [ ] レスポンスタイム改善

### Task 7.3: セキュリティ強化
- [ ] CSP設定
- [ ] CORS設定
- [ ] レート制限
- [ ] 入力サニタイゼーション

### Task 7.4: CI/CD
- [ ] GitHub Actions設定
- [ ] Web: S3 + CloudFront デプロイ自動化
- [ ] API: Lambda デプロイ自動化
- [ ] 環境変数管理
- [ ] デプロイ通知（Slack/Email）

### Task 7.5: ドキュメント整備
- [ ] README更新
- [ ] API ドキュメント
- [ ] デプロイ手順
- [ ] トラブルシューティング

---

## 今後の拡張（Phase 8+）

### 検索・整理機能
- [ ] タグ管理画面
- [ ] タグの編集・削除
- [ ] タグの色分け
- [ ] 高度な検索（AND/OR/NOT）
- [ ] 保存検索条件

### 共有機能
- [ ] ブックマーク公開
- [ ] 公開URL生成
- [ ] 共有リスト作成
- [ ] コラボレーション機能

### モバイルアプリ
- [ ] React Native / Expo セットアップ
- [ ] 基本UI実装
- [ ] オフライン対応
- [ ] プッシュ通知

### その他
- [ ] インポート機能（Pocket, Raindrop.io）
- [ ] エクスポート機能
- [ ] アーカイブ機能
- [ ] お気に入り機能
- [ ] メモ機能
- [ ] リマインダー機能
