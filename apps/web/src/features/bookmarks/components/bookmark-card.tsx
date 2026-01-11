'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import type { GetApiBookmarks200BookmarksItem } from '@/api/generated.schemas';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { EditBookmarkDialog } from './edit-bookmark-dialog';
import { DeleteBookmarkDialog } from './delete-bookmark-dialog';

interface BookmarkCardProps {
  bookmark: GetApiBookmarks200BookmarksItem;
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow group">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="line-clamp-2">
                <Link
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-2"
                >
                  {bookmark.title}
                  <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-50" />
                </Link>
              </CardTitle>
              {bookmark.ogDescription && (
                <CardDescription className="mt-2 line-clamp-2">
                  {bookmark.ogDescription}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {bookmark.ogImage && (
                <img
                  src={bookmark.ogImage}
                  alt={bookmark.title}
                  className="w-20 h-20 object-cover rounded-lg mr-2"
                  loading="lazy"
                />
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsEditOpen(true)}
                  aria-label="編集"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setIsDeleteOpen(true)}
                  aria-label="削除"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="truncate max-w-xs">{bookmark.url}</span>
            <time dateTime={bookmark.createdAt.toString()}>
              {formatDate(bookmark.createdAt)}
            </time>
          </div>
          {bookmark.summary && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {bookmark.summary}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 編集ダイアログ */}
      <EditBookmarkDialog
        bookmark={bookmark}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      {/* 削除確認ダイアログ */}
      <DeleteBookmarkDialog
        bookmark={bookmark}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
