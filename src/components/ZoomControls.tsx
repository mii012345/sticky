'use client';

import { Minus, Plus, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  minScale?: number;
  maxScale?: number;
}

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  minScale = 0.25,
  maxScale = 3,
}: ZoomControlsProps) {
  const percentage = Math.round(scale * 100);
  const canZoomOut = scale > minScale;
  const canZoomIn = scale < maxScale;

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white rounded-xl shadow-lg border border-zinc-200 p-1 z-50">
      {/* ズームアウト */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="p-2 rounded-lg hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="ズームアウト"
      >
        <Minus size={18} className="text-zinc-600" />
      </button>

      {/* ズーム率表示（クリックでリセット） */}
      <button
        onClick={onReset}
        className="px-3 py-1.5 min-w-[60px] text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
        title="100%にリセット"
      >
        {percentage}%
      </button>

      {/* ズームイン */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="p-2 rounded-lg hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="ズームイン"
      >
        <Plus size={18} className="text-zinc-600" />
      </button>

      {/* フィット */}
      <div className="w-px h-6 bg-zinc-200 mx-1" />
      <button
        onClick={onReset}
        className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
        title="画面にフィット"
      >
        <Maximize2 size={18} className="text-zinc-600" />
      </button>
    </div>
  );
}
