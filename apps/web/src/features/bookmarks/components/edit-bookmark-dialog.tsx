'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui';
import { BookmarkForm, type BookmarkFormData } from './bookmark-form';
import { useUpdateBookmark } from '../hooks/use-update-bookmark';
import type { GetApiBookmarks200BookmarksItem } from '@/api/generated.schemas';

interface EditBookmarkDialogProps {
  bookmark: GetApiBookmarks200BookmarksItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function EditBookmarkDialog({
  bookmark,
  open,
  onOpenChange,
  trigger,
}: EditBookmarkDialogProps) {
  const updateMutation = useUpdateBookmark();

  const handleSubmit = async (data: BookmarkFormData) => {
    await updateMutation.mutateAsync({
      id: bookmark.id,
      data: {
        url: data.url,
        title: data.title || undefined,
      },
    });
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ブックマークを編集</DialogTitle>
          <DialogDescription>
            ブックマークの情報を編集します。
          </DialogDescription>
        </DialogHeader>
        <BookmarkForm
          mode="edit"
          defaultValues={{
            url: bookmark.url,
            title: bookmark.title,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
