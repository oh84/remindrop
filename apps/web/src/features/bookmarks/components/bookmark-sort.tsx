'use client';

import { Button } from '@repo/ui';
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { GetApiBookmarksSortBy, GetApiBookmarksOrder } from '@/api/generated.schemas';

export interface SortOption {
  sortBy: GetApiBookmarksSortBy;
  order: GetApiBookmarksOrder;
}

interface BookmarkSortProps {
  sortBy: GetApiBookmarksSortBy;
  order: GetApiBookmarksOrder;
  onChange: (option: SortOption) => void;
}

const SORT_OPTIONS: { label: string; sortBy: GetApiBookmarksSortBy; order: GetApiBookmarksOrder }[] = [
  { label: '作成日時（新しい順）', sortBy: 'createdAt', order: 'desc' },
  { label: '作成日時（古い順）', sortBy: 'createdAt', order: 'asc' },
  { label: '更新日時（新しい順）', sortBy: 'updatedAt', order: 'desc' },
  { label: '更新日時（古い順）', sortBy: 'updatedAt', order: 'asc' },
];

export function BookmarkSort({ sortBy, order, onChange }: BookmarkSortProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 現在選択中のオプションのラベルを取得
  const currentLabel = SORT_OPTIONS.find(
    (opt) => opt.sortBy === sortBy && opt.order === order
  )?.label ?? '作成日時（新しい順）';

  // クリックアウトサイドでドロップダウンを閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (option: { sortBy: GetApiBookmarksSortBy; order: GetApiBookmarksOrder }) => {
    onChange({ sortBy: option.sortBy, order: option.order });
    setIsOpen(false);
  };

  const OrderIcon = order === 'asc' ? ArrowUp : ArrowDown;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <ArrowUpDown className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLabel}</span>
        <OrderIcon className="h-3 w-3 sm:hidden" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 rounded-md border bg-popover shadow-lg">
          <div className="py-1">
            {SORT_OPTIONS.map((option) => {
              const isSelected = option.sortBy === sortBy && option.order === order;
              return (
                <button
                  key={`${option.sortBy}-${option.order}`}
                  onClick={() => handleSelect(option)}
                  className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
