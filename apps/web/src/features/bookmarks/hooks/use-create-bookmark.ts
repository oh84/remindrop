import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@repo/ui';
import { usePostApiBookmarks } from '@/api/bookmarks';
import { bookmarkKeys } from './bookmark-keys';

/**
 * ブックマーク作成用のmutationフック
 * 成功時にキャッシュを無効化してトースト通知を表示
 */
export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return usePostApiBookmarks({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
        toast.success('ブックマークを作成しました');
      },
      onError: (error) => {
        console.error('ブックマーク作成エラー:', error);
        toast.error('ブックマークの作成に失敗しました');
      },
    },
  });
}
