'use client';

import { StickyNote, UserPlus, Trash2 } from 'lucide-react';
import { AvatarGroup } from './Avatar';
import { Participant } from '@/types';

interface HeaderProps {
  boardName: string;
  teamName?: string;
  stickyCount: number;
  archivedCount: number;
  isAnonymous?: boolean;
  participants: Participant[];
  onInviteClick: () => void;
  onTrashClick: () => void;
}

export function Header({
  boardName,
  teamName,
  stickyCount,
  archivedCount,
  isAnonymous,
  participants,
  onInviteClick,
  onTrashClick,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-16 w-full">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
            <StickyNote className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-zinc-900 font-['Plus_Jakarta_Sans']">
            Sticky
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-zinc-200" />

        {/* Board Info */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-zinc-900 font-['Plus_Jakarta_Sans']">
              {boardName}
            </h1>
            {isAnonymous && (
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                匿名モード
              </span>
            )}
          </div>
          <p className="text-[13px] text-zinc-500">
            {teamName && `${teamName} • `}{stickyCount}件のアイデア
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Participants */}
        <AvatarGroup
          participants={participants.map((p) => ({
            nickname: p.nickname,
            avatarColor: p.avatarColor,
          }))}
        />

        {/* Trash Button */}
        <button
          onClick={onTrashClick}
          className="relative flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
        >
          <Trash2 className="w-[18px] h-[18px] text-zinc-500" />
          {archivedCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
              {archivedCount}
            </span>
          )}
        </button>

        {/* Invite Button */}
        <button
          onClick={onInviteClick}
          className="flex items-center gap-2 h-10 px-4 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors"
        >
          <UserPlus className="w-[18px] h-[18px] text-zinc-500" />
          <span className="text-sm font-medium text-zinc-500">招待</span>
        </button>
      </div>
    </header>
  );
}
