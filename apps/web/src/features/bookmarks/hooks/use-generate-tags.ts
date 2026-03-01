import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@repo/ui';
import { usePostApiBookmarksIdGenerateTags } from '@/api/bookmarks';
import { bookmarkKeys } from './bookmark-keys';

/**
 * ブックマークタグ生成用のmutationフック
 * 成功時にキャッシュを無効化してトースト通知を表示
 */
export function useGenerateTags() {
  const queryClient = useQueryClient();

  return usePostApiBookmarksIdGenerateTags({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: bookmarkKeys.lists() });
        const tagCount = data.tags?.length ?? 0;
        toast.success(`${tagCount}個のタグを生成しました`);
      },
      onError: (error) => {
        console.error('タグ生成エラー:', error);
        toast.error('タグの生成に失敗しました');
      },
    },
  });
}
