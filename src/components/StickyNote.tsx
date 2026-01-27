'use client';

import { useState } from 'react';
import { Heart, Pencil, Trash2 } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface StickyNoteProps {
  id: string;
  content: string;
  authorName?: string;
  likes: number;
  isLiked: boolean;
  isOwner: boolean;
  isAnonymous?: boolean;
  x: number;
  y: number;
  rotation?: number;
  color?: string;
  onLike: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  isInGroup?: boolean;
  isDragOverlay?: boolean;
}

export function StickyNote({
  id,
  content,
  authorName,
  likes,
  isLiked,
  isOwner,
  isAnonymous,
  x,
  y,
  rotation = 0,
  color = '#FEF3C7',
  onLike,
  onEdit,
  onDelete,
  isInGroup = false,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: id,
    data: { type: 'sticky', id },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `drop-${id}`,
    data: { type: 'sticky', id },
  });

  // 両方の ref を組み合わせる
  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const style = isInGroup
    ? {
        transform: isDragging ? undefined : CSS.Translate.toString(transform),
        opacity: isDragging ? 0 : 1,
        transition: isDragging ? 'none' : undefined,
      }
    : {
        position: 'absolute' as const,
        left: x,
        top: y,
        transform: isDragging ? `rotate(${rotation}deg)` : `${CSS.Translate.toString(transform)} rotate(${rotation}deg)`,
        opacity: isDragging ? 0 : 1,
        transition: isDragging ? 'none' : undefined,
      };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME変換中（日本語入力の確定時など）は送信しない
    if (e.nativeEvent.isComposing) {
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setEditContent(content);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-[180px] rounded-xl p-4 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing ${
        isDragging ? 'z-50' : 'z-10'
      } ${isOver ? 'ring-4 ring-purple-400 ring-opacity-70' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div
        className="rounded-xl p-4 flex flex-col gap-2.5"
        style={{ backgroundColor: color }}
      >
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-[13px] text-amber-800 leading-relaxed resize-none focus:outline-none"
            rows={3}
            autoFocus
          />
        ) : (
          <p className="text-[13px] text-amber-800 leading-relaxed">{content}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Author */}
          {!isAnonymous && authorName && (
            <span className="text-xs text-amber-700/70">{authorName}</span>
          )}
          {(isAnonymous || !authorName) && <span />}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Like Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className="flex items-center gap-1 text-amber-700/70 hover:text-red-500 transition-colors"
            >
              <Heart
                className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
              />
              {likes > 0 && <span className="text-xs">{likes}</span>}
            </button>

            {/* Edit & Delete (Owner only) */}
            {isOwner && !isEditing && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="text-amber-700/50 hover:text-amber-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                  className="text-amber-700/50 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
