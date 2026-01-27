'use client';

import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface InviteDialogProps {
  boardId: string;
  onClose: () => void;
}

export function InviteDialog({ boardId, onClose }: InviteDialogProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/board/${boardId}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[400px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">チームメンバーを招待</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            下記のURLを共有すると、誰でもこのボードに参加できます。
          </p>

          {/* URL Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 h-12 px-4 rounded-xl bg-zinc-100 text-sm text-zinc-700 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`h-12 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-violet-500 text-white hover:bg-violet-600'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  コピー完了
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  コピー
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
