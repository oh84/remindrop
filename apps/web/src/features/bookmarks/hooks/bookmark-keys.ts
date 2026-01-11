import { getGetApiBookmarksQueryKey } from '@/api/bookmarks';
import type { GetApiBookmarksParams } from '@/api/generated.schemas';

/**
 * Query key factory for bookmarks
 * Uses Orval generated query key factory
 */
export const bookmarkKeys = {
  all: ['/api/bookmarks'] as const,
  lists: () => [...bookmarkKeys.all] as const,
  list: (params?: GetApiBookmarksParams) => getGetApiBookmarksQueryKey(params),
};
