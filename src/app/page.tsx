'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getBoardsWithStats } from '@/lib/firestore';
import { BoardCard, NewBoardCard } from '@/components/BoardCard';
import { Board, Participant } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface BoardWithStats {
  board: Board;
  stickyCount: number;
  participantCount: number;
  participants: Participant[];
}

export default function Home() {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storedUser] = useLocalStorage<{ odclientId: string; nickname: string } | null>(
    'sticky-user',
    null
  );

  useEffect(() => {
    async function loadBoards() {
      try {
        const boardsData = await getBoardsWithStats();
        setBoards(boardsData);
      } catch (error) {
        console.error('Failed to load boards:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBoards();
  }, []);

  const handleCreateBoard = () => {
    router.push('/create');
  };

  const handleBoardClick = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1280px] mx-auto px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between h-16 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500" />
            <span className="text-2xl font-bold text-zinc-900 font-['Plus_Jakarta_Sans']">
              Sticky
            </span>
          </div>
          {storedUser && (
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-semibold"
                title={storedUser.nickname}
              >
                {storedUser.nickname.charAt(0)}
              </div>
            </div>
          )}
        </header>

        {/* Title Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-zinc-900 font-['Plus_Jakarta_Sans']">
              マイボード
            </h1>
            <p className="text-sm text-zinc-500">
              あなたが作成・参加しているボード
            </p>
          </div>
          <button
            onClick={handleCreateBoard}
            className="flex items-center gap-2 h-12 px-5 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新規ボード作成
          </button>
        </div>

        {/* Board Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-zinc-500">読み込み中...</div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {boards.map((boardData) => (
              <BoardCard
                key={boardData.board.id}
                board={boardData.board}
                stickyCount={boardData.stickyCount}
                participantCount={boardData.participantCount}
                participants={boardData.participants}
                onClick={() => handleBoardClick(boardData.board.id)}
              />
            ))}
            <NewBoardCard onClick={handleCreateBoard} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && boards.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-zinc-400" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">
              まだボードがありません
            </h2>
            <p className="text-zinc-500 mb-6">
              新しいボードを作成して、ブレインストーミングを始めましょう
            </p>
            <button
              onClick={handleCreateBoard}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              最初のボードを作成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
