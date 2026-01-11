'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui';
import { useDeleteBookmark } from '../hooks/use-delete-bookmark';
import type { GetApiBookmarks200BookmarksItem } from '@/api/generated.schemas';

interface DeleteBookmarkDialogProps {
  bookmark: GetApiBookmarks200BookmarksItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function DeleteBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
  trigger,
}: DeleteBookmarkDialogProps) {
  const deleteMutation = useDeleteBookmark();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: bookmark.id });
      onOpenChange?.(false);
    } catch (error) {
      // エラーは useDeleteBookmark の onError で処理済み
      console.error('ブックマーク削除エラー:', error);
    }
  };

  const handleCancel = () => {
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ブックマークを削除</DialogTitle>
          <DialogDescription>
            「{bookmark.title}」を削除しますか？この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={deleteMutation.isPending}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? '削除中...' : '削除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
