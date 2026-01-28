'use client';

import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';

interface FloatingInputProps {
  onSubmit: (content: string) => void;
  maxLength?: number;
}

export function FloatingInput({ onSubmit, maxLength = 200 }: FloatingInputProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (content.trim()) {
      setIsSubmitting(true);
      onSubmit(content.trim());
      setContent('');
      setTimeout(() => setIsSubmitting(false), 300);
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
    <div className={`absolute bottom-8 right-8 w-[280px] bg-white rounded-2xl p-4 shadow-xl flex flex-col gap-3 z-30
      animate-slide-in-bottom transition-all duration-300
      ${isFocused ? 'shadow-2xl scale-[1.02] ring-2 ring-violet-200' : ''}`}>
      {/* Header */}
      <div className="flex items-center">
        <span className={`text-xs font-medium transition-colors duration-200 ${isFocused ? 'text-violet-500' : 'text-zinc-500'}`}>
          アイデアを入力
        </span>
      </div>

      {/* Input Area */}
      <div className={`rounded-[10px] bg-zinc-50 p-3 h-20 transition-all duration-200
        ${isFocused ? 'bg-violet-50/50' : ''}`}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="ここにアイデアを書く..."
          className="w-full h-full bg-transparent text-sm text-zinc-700 placeholder:text-zinc-400 resize-none focus:outline-none"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] transition-colors duration-200 ${content.length > maxLength * 0.8 ? 'text-amber-500' : 'text-zinc-400'}`}>
          {content.length}/{maxLength}
        </span>
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-500 text-white text-sm font-medium
            hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md
            ${isSubmitting ? 'animate-pop' : ''}`}
        >
          <Plus className={`w-4 h-4 transition-transform duration-200 ${isSubmitting ? 'rotate-180' : ''}`} />
          追加
        </button>
      </div>
    </div>
  );
}
