'use client';

import { useState } from 'react';
import { UserCircle } from 'lucide-react';

interface NicknameDialogProps {
  onSubmit: (nickname: string) => void;
}

export function NicknameDialog({ onSubmit }: NicknameDialogProps) {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onSubmit(nickname.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-backdrop-fade">
      <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center animate-bounce-subtle">
            <UserCircle className="w-8 h-8 text-violet-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-zinc-900 text-center mb-2">
          ボードに参加
        </h2>
        <p className="text-sm text-zinc-500 text-center mb-6">
          ニックネームを入力してブレストに参加しましょう
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例: 田中太郎"
            className="w-full h-12 px-4 rounded-xl bg-zinc-100 text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200 input-focus-ring"
            autoFocus
            maxLength={20}
          />
          <button
            type="submit"
            disabled={!nickname.trim()}
            className="w-full h-12 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
          >
            参加する
          </button>
        </form>
      </div>
    </div>
  );
}
