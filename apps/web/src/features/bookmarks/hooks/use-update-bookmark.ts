import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@repo/ui';
import { usePatchApiBookmarksId } from '@/api/bookmarks';
import { bookmarkKeys } from './bookmark-keys';

/**
 * ブックマーク更新用のmutationフック
 * 成功時にキャッシュを無効化してトースト通知を表示
 */
export function useUpdateBookmark() {
  const queryClient = useQueryClient();

  return usePatchApiBookmarksId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
        toast.success('ブックマークを更新しました');
      },
      onError: (error) => {
        console.error('ブックマーク更新エラー:', error);
        toast.error('ブックマークの更新に失敗しました');
      },
    },
  });
}
