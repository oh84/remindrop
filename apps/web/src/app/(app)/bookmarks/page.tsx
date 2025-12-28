'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookmarkList } from '@/features/bookmarks';

export default function BookmarksPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/bookmarks?${params.toString()}`);
  };

  // ページが1未満の場合は1に修正
  useEffect(() => {
    if (page < 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');
      router.replace(`/bookmarks?${params.toString()}`);
    }
  }, [page, searchParams, router]);

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
