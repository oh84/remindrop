import { useGetApiBookmarks, getGetApiBookmarksQueryKey } from '@/api/bookmarks';
import type { GetApiBookmarksParams } from '@/api/generated.schemas';

/**
 * Query key factory for bookmarks
 * Uses Orval generated query key factory
 */
export const bookmarkKeys = {
  all: ['/api/bookmarks'] as const,
  lists: () => [...bookmarkKeys.all] as const,
  list: (params?: GetApiBookmarksParams) =>
    getGetApiBookmarksQueryKey(params),
};

/**
 * ブックマーク一覧を取得するReact Queryフック
 * Orval生成のuseGetApiBookmarksをラップしてFeature固有のロジックを追加
 */
export function useBookmarks(params: GetApiBookmarksParams = {}) {
  return useGetApiBookmarks(params);
}
