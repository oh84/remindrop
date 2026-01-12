'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@repo/ui';
import { Plus } from 'lucide-react';
import { BookmarkList, CreateBookmarkDialog, BookmarkSort } from '@/features/bookmarks';
import type { SortOption } from '@/features/bookmarks';
import type { GetApiBookmarksSortBy, GetApiBookmarksOrder } from '@/api/generated.schemas';

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
const sortBySchema = z.enum(['createdAt', 'updatedAt']);
const orderSchema = z.enum(['asc', 'desc']);

export default function BookmarksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // URLパラメータを検証してクランプ（無効な値でAPIリクエストを送信しないように）
  const pageResult = pageSchema.safeParse(searchParams.get('page'));
  const limitResult = limitSchema.safeParse(searchParams.get('limit'));
  const sortByResult = sortBySchema.safeParse(searchParams.get('sortBy'));
  const orderResult = orderSchema.safeParse(searchParams.get('order'));
  const page = pageResult.success ? pageResult.data : 1;
  const limit = limitResult.success ? limitResult.data : 20;
  const sortBy: GetApiBookmarksSortBy = sortByResult.success ? sortByResult.data : 'createdAt';
  const order: GetApiBookmarksOrder = orderResult.success ? orderResult.data : 'desc';

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/bookmarks?${params.toString()}`);
  };

  const handleSortChange = (option: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', option.sortBy);
    params.set('order', option.order);
    params.set('page', '1'); // ソート変更時は1ページ目に戻る
    router.push(`/bookmarks?${params.toString()}`);
  };

  // URLパラメータが無効な場合は修正（クランプされた値と異なる場合）
  useEffect(() => {
    const urlPageParam = searchParams.get('page');
    const urlLimitParam = searchParams.get('limit');
    const urlSortByParam = searchParams.get('sortBy');
    const urlOrderParam = searchParams.get('order');

    const pageResult = urlPageParam ? pageSchema.safeParse(urlPageParam) : null;
    const limitResult = urlLimitParam ? limitSchema.safeParse(urlLimitParam) : null;
    const sortByResult = urlSortByParam ? sortBySchema.safeParse(urlSortByParam) : null;
    const orderResult = urlOrderParam ? orderSchema.safeParse(urlOrderParam) : null;

    const shouldUpdatePage =
      urlPageParam !== null &&
      (!pageResult?.success || pageResult.data !== page);
    const shouldUpdateLimit =
      urlLimitParam !== null &&
      (!limitResult?.success || limitResult.data !== limit);
    const shouldUpdateSortBy =
      urlSortByParam !== null &&
      (!sortByResult?.success || sortByResult.data !== sortBy);
    const shouldUpdateOrder =
      urlOrderParam !== null &&
      (!orderResult?.success || orderResult.data !== order);

    if (shouldUpdatePage || shouldUpdateLimit || shouldUpdateSortBy || shouldUpdateOrder) {
      const params = new URLSearchParams(searchParams.toString());
      if (shouldUpdatePage) params.set('page', page.toString());
      if (shouldUpdateLimit) params.set('limit', limit.toString());
      if (shouldUpdateSortBy) params.set('sortBy', sortBy);
      if (shouldUpdateOrder) params.set('order', order);
      router.replace(`/bookmarks?${params.toString()}`);
    }
  }, [page, limit, sortBy, order, searchParams, router]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ブックマーク
        </h1>
        <div className="flex items-center gap-2">
          <BookmarkSort sortBy={sortBy} order={order} onChange={handleSortChange} />
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            追加
          </Button>
        </div>
      </div>
      <BookmarkList
        page={page}
        limit={limit}
        sortBy={sortBy}
        order={order}
        onPageChange={handlePageChange}
      />
      <CreateBookmarkDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
