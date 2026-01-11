import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@repo/ui';
import { useDeleteApiBookmarksId } from '@/api/bookmarks';
import { bookmarkKeys } from './bookmark-keys';

/**
 * ブックマーク削除用のmutationフック
 * 成功時にキャッシュを無効化してトースト通知を表示
 */
export function useDeleteBookmark() {
  const queryClient = useQueryClient();

  return useDeleteApiBookmarksId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
        toast.success('ブックマークを削除しました');
      },
      onError: (error) => {
        console.error('ブックマーク削除エラー:', error);
        toast.error('ブックマークの削除に失敗しました');
      },
    },
  });
}
