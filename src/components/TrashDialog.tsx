'use client';

import { X, RotateCcw } from 'lucide-react';
import { Sticky } from '@/types';

interface TrashDialogProps {
  archivedStickies: Sticky[];
  onRestore: (stickyId: string) => void;
  onClose: () => void;
}

export function TrashDialog({ archivedStickies, onRestore, onClose }: TrashDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[480px] max-h-[600px] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            ゴミ箱
            {archivedStickies.length > 0 && (
              <span className="ml-2 text-sm font-normal text-zinc-500">
                ({archivedStickies.length}件)
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {archivedStickies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <p className="text-sm">ゴミ箱は空です</p>
            </div>
          ) : (
            <div className="space-y-2">
              {archivedStickies.map((sticky) => (
                <div
                  key={sticky.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors"
                >
                  {/* Sticky preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 truncate">{sticky.content}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{sticky.authorName}</p>
                  </div>

                  {/* Restore button */}
                  <button
                    onClick={() => onRestore(sticky.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-medium hover:bg-violet-600 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    復元
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
