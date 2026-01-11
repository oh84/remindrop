'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui';

const bookmarkFormSchema = z.object({
  url: z
    .url({ message: '有効なURLを入力してください' })
    .min(1, 'URLを入力してください')
    .max(2048, 'URLは2048文字以内で入力してください'),
  title: z
    .string()
    .max(200, 'タイトルは200文字以内で入力してください')
    .optional()
    .or(z.literal('')),
});

export type BookmarkFormData = z.infer<typeof bookmarkFormSchema>;

interface BookmarkFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<BookmarkFormData>;
  onSubmit: (data: BookmarkFormData) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function BookmarkForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BookmarkFormProps) {
  const form = useForm<BookmarkFormData>({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues: {
      url: defaultValues?.url ?? '',
      title: defaultValues?.title ?? '',
    },
  });

  const handleSubmit = async (data: BookmarkFormData) => {
    // 空のtitleはundefinedに変換
    const submitData = {
      ...data,
      title: data.title || undefined,
    };
    await onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  autoComplete="url"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                タイトル{' '}
                <span className="text-muted-foreground font-normal">(任意)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="ブックマークのタイトル"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create'
                ? '作成中...'
                : '更新中...'
              : mode === 'create'
                ? '作成'
                : '更新'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
