import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@repo/ui';
import { usePostApiBookmarksIdSummarize } from '@/api/bookmarks';
import { bookmarkKeys } from './bookmark-keys';

/**
 * ブックマーク要約生成用のmutationフック
 * 成功時にキャッシュを無効化してトースト通知を表示
 */
export function useSummarizeBookmark() {
  const queryClient = useQueryClient();

  return usePostApiBookmarksIdSummarize({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
        toast.success('要約を生成しました');
      },
      onError: (error) => {
        console.error('要約生成エラー:', error);
        toast.error('要約の生成に失敗しました');
      },
    },
  });
}
