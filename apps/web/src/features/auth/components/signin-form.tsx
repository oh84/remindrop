'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from '@/lib/auth-client';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui';
import Link from 'next/link';

const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .max(254, 'メールアドレスは254文字以内で入力してください') // RFC 5321の標準最大長
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください')
    .max(128, 'パスワードは128文字以内で入力してください'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm() {
  const [error, setError] = useState('');

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setError('');

    await signIn.email(
      {
        email: data.email,
        password: data.password,
        callbackURL: '/bookmarks', // サインイン成功後にリダイレクト
      },
      {
        onError: (ctx) => {
          setError(ctx.error.message || 'ログインに失敗しました');
        },
      }
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-2xl text-center">ログイン</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" className="text-primary hover:underline font-medium">
            新規登録
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
