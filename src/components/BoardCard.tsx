'use client';

import { StickyNote, Users, EyeOff } from 'lucide-react';
import { Board, Participant } from '@/types';
import { Timestamp } from 'firebase/firestore';

interface BoardCardProps {
  board: Board;
  stickyCount: number;
  participantCount: number;
  participants: Participant[];
  onClick: () => void;
}

function formatRelativeTime(timestamp: Timestamp | number): string {
  const date = typeof timestamp === 'number'
    ? new Date(timestamp)
    : timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays === 1) return '昨日';
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffWeeks < 4) return `${diffWeeks}週間前`;
  return date.toLocaleDateString('ja-JP');
}

export function BoardCard({
  board,
  stickyCount,
  participantCount,
  participants,
  onClick,
}: BoardCardProps) {
  const displayParticipants = participants.slice(0, 3);

  return (
    <button
      onClick={onClick}
      className="w-full sm:w-[384px] bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-4 hover:border-violet-300 hover:shadow-md transition-all text-left"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-zinc-900 font-['Plus_Jakarta_Sans']">
            {board.name}
          </h3>
          <p className="text-sm text-zinc-500">
            {board.teamName || 'チーム未設定'}
          </p>
        </div>
        {board.isAnonymous && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/10">
            <EyeOff className="w-3 h-3 text-violet-500" />
            <span className="text-xs font-medium text-violet-500">匿名</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <StickyNote className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-500">{stickyCount} アイデア</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-zinc-400" />
          <span className="text-sm text-zinc-500">{participantCount} メンバー</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {displayParticipants.map((participant) => (
            <div
              key={participant.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white border-2 border-white"
              style={{ backgroundColor: participant.avatarColor }}
              title={participant.nickname}
            >
              {participant.nickname.charAt(0)}
            </div>
          ))}
          {participantCount > 3 && (
            <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600 border-2 border-white">
              +{participantCount - 3}
            </div>
          )}
        </div>
        <span className="text-xs text-zinc-400">
          最終更新: {formatRelativeTime(board.updatedAt)}
        </span>
      </div>
    </button>
  );
}

export function NewBoardCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full sm:w-[384px] h-[152px] bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-3 hover:border-violet-300 hover:bg-violet-50/50 transition-all"
    >
      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
        <span className="text-2xl text-zinc-400">+</span>
      </div>
      <span className="text-sm font-medium text-zinc-500">新しいボードを作成</span>
    </button>
  );
}
