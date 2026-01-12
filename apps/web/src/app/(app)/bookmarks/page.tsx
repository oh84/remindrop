'use client';

import { useState, useCallback } from 'react';
import { createParser, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { Button } from '@repo/ui';
import { Plus } from 'lucide-react';
import { BookmarkList, CreateBookmarkDialog, BookmarkSort, BookmarkSearch, BookmarkDateFilter } from '@/features/bookmarks';
import type { SortOption, DateFilterValue } from '@/features/bookmarks';

// ページ番号パーサー (min: 1)
const parseAsPage = createParser({
  parse: (value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return null;
    return num;
  },
  serialize: (value) => String(value),
}).withDefault(1);

// リミットパーサー (min: 1, max: 100)
const parseAsLimit = createParser({
  parse: (value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 100) return null;
    return num;
  },
  serialize: (value) => String(value),
}).withDefault(20);

// 検索クエリパーサー (max: 200)
const parseAsQuery = createParser({
  parse: (value) => {
    if (!value || value.length > 200) return null;
    return value;
  },
  serialize: (value) => value,
}).withDefault('');

// YYYY-MM-DD形式の日付文字列パーサー
const parseAsDateString = createParser({
  parse: (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return value;
  },
  serialize: (value) => value,
});

// URLパラメータのパーサー定義
const bookmarkSearchParams = {
  page: parseAsPage,
  limit: parseAsLimit,
  sortBy: parseAsStringLiteral(['createdAt', 'updatedAt'] as const).withDefault('createdAt'),
  order: parseAsStringLiteral(['asc', 'desc'] as const).withDefault('desc'),
  q: parseAsQuery,
  fromDate: parseAsDateString,
  toDate: parseAsDateString,
};

export default function BookmarksPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [params, setParams] = useQueryStates(bookmarkSearchParams, {
    shallow: false, // サーバーにリクエストを送る
  });

  const { page, limit, sortBy, order, q: query, fromDate, toDate } = params;

  const handlePageChange = (newPage: number) => {
    setParams({ page: newPage });
  };

  const handleSortChange = (option: SortOption) => {
    setParams({ sortBy: option.sortBy, order: option.order, page: 1 });
  };

  const handleSearchChange = useCallback((newQuery: string) => {
    setParams({ q: newQuery || null, page: 1 });
  }, [setParams]);

  const handleDateFilterChange = (dateFilter: DateFilterValue) => {
    setParams({
      fromDate: dateFilter.fromDate || null,
      toDate: dateFilter.toDate || null,
      page: 1,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ブックマーク
        </h1>
        <div className="flex items-center gap-2">
          <BookmarkDateFilter value={{ fromDate: fromDate ?? undefined, toDate: toDate ?? undefined }} onChange={handleDateFilterChange} />
          <BookmarkSort sortBy={sortBy} order={order} onChange={handleSortChange} />
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            追加
          </Button>
        </div>
      </div>
      <div className="mb-6">
        <BookmarkSearch value={query} onChange={handleSearchChange} />
      </div>
      <BookmarkList
        page={page}
        limit={limit}
        sortBy={sortBy}
        order={order}
        query={query}
        fromDate={fromDate ?? undefined}
        toDate={toDate ?? undefined}
        onPageChange={handlePageChange}
      />
      <CreateBookmarkDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
