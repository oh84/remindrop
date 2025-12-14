import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="max-w-2xl p-8 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100">
            Remindrop
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            ブックマーク管理アプリ with AI
          </p>
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <Button asChild size="lg">
            <a href="/auth/signin">ログイン</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/auth/signup">新規登録</a>
          </Button>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Phase 1: 基盤構築中 🚧</p>
        </div>
      </Card>
    </div>
  );
}
