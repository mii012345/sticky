'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StickyNote, Plus, EyeOff, Clock, ArrowLeft } from 'lucide-react';
import { createBoard, joinBoard } from '@/lib/firestore';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function CreateBoardPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [boardName, setBoardName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hasTimer, setHasTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [isLoading, setIsLoading] = useState(false);

  const [storedUser, setStoredUser] = useLocalStorage<{ odclientId: string; nickname: string } | null>(
    'sticky-user',
    null
  );

  // ローカルストレージからニックネームを初期化
  useState(() => {
    if (storedUser?.nickname) {
      setNickname(storedUser.nickname);
    }
  });

  const handleCreateBoard = async () => {
    if (!boardName.trim() || !nickname.trim()) return;

    setIsLoading(true);
    try {
      const creatorNickname = nickname.trim();

      // ボードを作成
      const boardId = await createBoard({
        name: boardName.trim(),
        teamName: teamName.trim() || undefined,
        description: description.trim() || undefined,
        isAnonymous,
        timerMinutes: hasTimer ? timerMinutes : undefined,
        createdBy: 'temp-creator-id',
      });

      // 作成者を参加者として追加
      const { odclientId } = await joinBoard(boardId, creatorNickname);

      // ローカルストレージに保存
      setStoredUser({ odclientId, nickname: creatorNickname });

      // ボード画面へ遷移
      router.push(`/board/${boardId}`);
    } catch (error) {
      console.error('Failed to create board:', error);
      alert('ボードの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-3xl p-8 shadow-lg border border-zinc-200">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">戻る</span>
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-violet-500 flex items-center justify-center">
            <StickyNote className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 font-['Plus_Jakarta_Sans']">
            新しいボードを作成
          </h1>
          <p className="text-sm text-zinc-500">
            チームでブレインストーミングを始めましょう
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5 mb-8">
          {/* Nickname */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-900">あなたのニックネーム</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="例: たろう"
              className="w-full h-12 px-4 rounded-xl bg-zinc-100 text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Board Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-900">ボード名</label>
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="例: Q1 プロダクト企画ブレスト"
              className="w-full h-12 px-4 rounded-xl bg-zinc-100 text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Team Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-900">チーム名（任意）</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="例: マーケティングチーム"
              className="w-full h-12 px-4 rounded-xl bg-zinc-100 text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-900">説明（任意）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ボードの目的や議題を入力..."
              className="w-full h-20 px-4 py-3 rounded-xl bg-zinc-100 text-zinc-700 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4 mb-8">
          <label className="text-sm font-semibold text-zinc-900">オプション</label>

          {/* Anonymous Mode */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-violet-500/20 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">匿名モード</p>
                <p className="text-xs text-zinc-500">投稿者の名前を非表示にします</p>
              </div>
            </div>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                isAnonymous ? 'bg-violet-500' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  isAnonymous ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-teal-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">タイマー設定</p>
                <p className="text-xs text-zinc-500">ブレスト時間を設定します</p>
              </div>
            </div>
            <button
              onClick={() => setHasTimer(!hasTimer)}
              className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                hasTimer ? 'bg-violet-500' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  hasTimer ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Timer Duration */}
          {hasTimer && (
            <div className="flex items-center gap-2 px-4">
              <span className="text-sm text-zinc-600">時間:</span>
              <select
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Number(e.target.value))}
                className="h-10 px-3 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value={5}>5分</option>
                <option value={10}>10分</option>
                <option value={15}>15分</option>
                <option value={30}>30分</option>
                <option value={45}>45分</option>
                <option value={60}>60分</option>
              </select>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleCreateBoard}
            disabled={!boardName.trim() || !nickname.trim() || isLoading}
            className="w-full h-[52px] rounded-xl bg-violet-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
            {isLoading ? '作成中...' : 'ボードを作成'}
          </button>
        </div>
      </div>
    </div>
  );
}
