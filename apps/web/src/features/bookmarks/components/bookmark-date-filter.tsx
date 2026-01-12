'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input } from '@repo/ui';
import { Calendar, X } from 'lucide-react';

export interface DateFilterValue {
  fromDate?: string;
  toDate?: string;
}

interface BookmarkDateFilterProps {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
}

export function BookmarkDateFilter({ value, onChange }: BookmarkDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFromDate, setLocalFromDate] = useState(value.fromDate ?? '');
  const [localToDate, setLocalToDate] = useState(value.toDate ?? '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasFilter = value.fromDate || value.toDate;

  // 外部からのvalue変更を反映
  useEffect(() => {
    setLocalFromDate(value.fromDate ?? '');
    setLocalToDate(value.toDate ?? '');
  }, [value.fromDate, value.toDate]);

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

  const handleApply = () => {
    onChange({
      fromDate: localFromDate || undefined,
      toDate: localToDate || undefined,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalFromDate('');
    setLocalToDate('');
    onChange({ fromDate: undefined, toDate: undefined });
    setIsOpen(false);
  };

  const getFilterLabel = () => {
    if (value.fromDate && value.toDate) {
      return `${value.fromDate} 〜 ${value.toDate}`;
    }
    if (value.fromDate) {
      return `${value.fromDate} 〜`;
    }
    if (value.toDate) {
      return `〜 ${value.toDate}`;
    }
    return '日付フィルター';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`gap-2 ${hasFilter ? 'border-primary' : ''}`}
      >
        <Calendar className="h-4 w-4" />
        <span className="hidden sm:inline max-w-32 truncate">{getFilterLabel()}</span>
        {hasFilter && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }
            }}
            className="ml-1 hover:text-destructive cursor-pointer"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-md border bg-popover p-4 shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">開始日</label>
              <Input
                type="date"
                value={localFromDate}
                onChange={(e) => setLocalFromDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">終了日</label>
              <Input
                type="date"
                value={localToDate}
                onChange={(e) => setLocalToDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex-1"
              >
                クリア
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                className="flex-1"
              >
                適用
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
