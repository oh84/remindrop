'use client';

import { Button } from '@repo/ui';
import { useBookmarks } from '../hooks/use-bookmarks';
import { BookmarkCard } from './bookmark-card';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface BookmarkListProps {
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
}

export function BookmarkList({
  page = 1,
  limit = 20,
  onPageChange,
}: BookmarkListProps) {
  const { data, isLoading, isError, error } = useBookmarks({ page, limit });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">読み込み中...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive font-medium">
          エラーが発生しました
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : '不明なエラーが発生しました'}
        </p>
      </div>
    );
  }

  if (!data || data.bookmarks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">ブックマークがありません</p>
        <p className="mt-2 text-sm text-muted-foreground">
          新しいブックマークを追加してください
        </p>
      </div>
    );
  }

  const { bookmarks, total, page: currentPage, limit: currentLimit } = data;
  const totalPages = Math.ceil(total / currentLimit);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handlePrevPage = () => {
    if (hasPrevPage && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {total}件中 {((currentPage - 1) * currentLimit) + 1}-
            {Math.min(currentPage * currentLimit, total)}件を表示
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>
            <div className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNextPage}
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
