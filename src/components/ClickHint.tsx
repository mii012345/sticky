'use client';

import { MousePointerClick } from 'lucide-react';

export function ClickHint() {
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-2 bg-white rounded-full shadow-lg z-20">
      <MousePointerClick className="w-3.5 h-3.5 text-violet-500" />
      <span className="text-xs text-zinc-500">
        クリックで追加 • ドラッグでグループ化
      </span>
    </div>
  );
}
