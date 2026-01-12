'use client';

import { useState, useEffect } from 'react';
import { Input } from '@repo/ui';
import { Search, X } from 'lucide-react';

interface BookmarkSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BookmarkSearch({
  value,
  onChange,
  placeholder = 'タイトルまたはURLで検索...',
}: BookmarkSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // 外部からのvalue変更を反映
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // デバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="検索をクリア"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
