import { useGetApiBookmarks } from '@/api/bookmarks';
import type { GetApiBookmarksParams } from '@/api/generated.schemas';

/**
 * ブックマーク一覧を取得するReact Queryフック
 * Orval生成のuseGetApiBookmarksをラップしてFeature固有のロジックを追加
 */
export function useBookmarks(params: GetApiBookmarksParams = {}) {
  return useGetApiBookmarks(params);
}
