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
import { useCreateBookmark } from '../hooks/use-create-bookmark';

interface CreateBookmarkDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreateBookmarkDialog({
  open,
  onOpenChange,
  trigger,
}: CreateBookmarkDialogProps) {
  const createMutation = useCreateBookmark();

  const handleSubmit = async (data: BookmarkFormData) => {
    await createMutation.mutateAsync({
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
          <DialogTitle>ブックマークを追加</DialogTitle>
          <DialogDescription>
            新しいブックマークを追加します。URLは必須です。
          </DialogDescription>
        </DialogHeader>
        <BookmarkForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
