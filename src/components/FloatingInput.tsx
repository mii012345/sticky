'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface FloatingInputProps {
  onSubmit: (content: string) => void;
  maxLength?: number;
}

export function FloatingInput({ onSubmit, maxLength = 200 }: FloatingInputProps) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim());
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中（日本語入力の確定時など）は送信しない
    if (e.nativeEvent.isComposing) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="absolute bottom-8 right-8 w-[280px] bg-white rounded-2xl p-4 shadow-xl flex flex-col gap-3 z-30">
      {/* Header */}
      <div className="flex items-center">
        <span className="text-xs font-medium text-zinc-500">アイデアを入力</span>
      </div>

      {/* Input Area */}
      <div className="rounded-[10px] bg-zinc-50 p-3 h-20">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder="ここにアイデアを書く..."
          className="w-full h-full bg-transparent text-sm text-zinc-700 placeholder:text-zinc-400 resize-none focus:outline-none"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-zinc-400">
          {content.length}/{maxLength}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          追加
        </button>
      </div>
    </div>
  );
}
