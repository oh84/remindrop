'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { z } from 'zod';
import { BookmarkList } from '@/features/bookmarks';

const pageSchema = z.coerce
  .number()
  .refine((val) => !isNaN(val))
  .int()
  .min(1);
const limitSchema = z.coerce
  .number()
  .refine((val) => !isNaN(val))
  .int()
  .min(1)
  .max(100);

export default function BookmarksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URLパラメータを検証してクランプ（無効な値でAPIリクエストを送信しないように）
  const pageResult = pageSchema.safeParse(searchParams.get('page'));
  const limitResult = limitSchema.safeParse(searchParams.get('limit'));
  const page = pageResult.success ? pageResult.data : 1;
  const limit = limitResult.success ? limitResult.data : 20;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/bookmarks?${params.toString()}`);
  };

  // URLパラメータが無効な場合は修正（クランプされた値と異なる場合）
  useEffect(() => {
    const urlPageParam = searchParams.get('page');
    const urlLimitParam = searchParams.get('limit');

    const pageResult = urlPageParam ? pageSchema.safeParse(urlPageParam) : null;
    const limitResult = urlLimitParam ? limitSchema.safeParse(urlLimitParam) : null;

    const shouldUpdatePage =
      urlPageParam !== null &&
      (!pageResult?.success || pageResult.data !== page);
    const shouldUpdateLimit =
      urlLimitParam !== null &&
      (!limitResult?.success || limitResult.data !== limit);

    if (shouldUpdatePage || shouldUpdateLimit) {
      const params = new URLSearchParams(searchParams.toString());
      if (shouldUpdatePage) params.set('page', page.toString());
      if (shouldUpdateLimit) params.set('limit', limit.toString());
      router.replace(`/bookmarks?${params.toString()}`);
    }
  }, [page, limit, searchParams, router]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        ブックマーク
      </h1>
      <BookmarkList
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
