'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X, Heart, Pencil, Trash2 } from 'lucide-react';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Sticky } from '@/types';

interface NoteGroupProps {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  stickies: Sticky[];
  isAnonymous?: boolean;
  odclientId: string | null;
  isBroughtToFront?: boolean; // 最前面に表示するかどうか
  onNameChange: (name: string) => void;
  onDisband: () => void;
  onStickyLike: (stickyId: string) => void;
  onStickyEdit: (stickyId: string, content: string) => void;
  onStickyDelete: (stickyId: string) => void;
  onReorderStickies?: (stickyIds: string[]) => void; // グループ内の付箋の並び替え
  isNew?: boolean; // 新規作成フラグ
}

export function NoteGroup({
  id,
  name,
  x,
  y,
  color,
  stickies,
  isAnonymous,
  odclientId,
  isBroughtToFront = false,
  onNameChange,
  onDisband,
  onStickyLike,
  onStickyEdit,
  onStickyDelete,
  onReorderStickies,
  isNew = false,
}: NoteGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(name);
  const [showEntranceAnimation, setShowEntranceAnimation] = useState(isNew);
  const [isToggling, setIsToggling] = useState(false);
  const [prevStickyCount, setPrevStickyCount] = useState(stickies.length);
  const [showAddPulse, setShowAddPulse] = useState(false);

  // 新規作成時のアニメーションをリセット
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setShowEntranceAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // 付箋追加時のパルスアニメーション
  useEffect(() => {
    if (stickies.length > prevStickyCount && !isNew) {
      setShowAddPulse(true);
      const timer = setTimeout(() => setShowAddPulse(false), 400);
      setPrevStickyCount(stickies.length);
      return () => clearTimeout(timer);
    }
    setPrevStickyCount(stickies.length);
  }, [stickies.length, prevStickyCount, isNew]);

  // 展開/折りたたみ時のアニメーション
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsToggling(false), 300);
  };

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `group-${id}`,
    data: { type: 'group', id },
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: `group-drag-${id}`,
    data: { type: 'group', id },
  });

  // 仕様: グループは常に垂直（rotation: 0）- 斜めにしない
  const style = {
    position: 'absolute' as const,
    left: x,
    top: y,
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    transition: isDragging ? 'none' : undefined,
  };

  const handleSaveName = () => {
    if (editName.trim()) {
      onNameChange(editName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div
      ref={(node) => {
        setDraggableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={`${stickies.length >= 4 ? 'w-[300px]' : 'w-[220px]'} rounded-2xl flex flex-col
        ${isDragging ? 'z-50' : isBroughtToFront ? 'z-30' : 'z-20'}
        ${showEntranceAnimation ? 'animate-group-merge' : ''}
        transition-all duration-200`}
      {...attributes}
      {...listeners}
    >
      <div
        className={`rounded-2xl p-2.5 flex flex-col gap-1 transition-all duration-200
          ${!isDragging ? 'hover:shadow-lg hover:scale-[1.01]' : ''}
          ${isOver ? 'ring-2 ring-white/70 shadow-xl animate-group-highlight' : ''}
          ${showAddPulse ? 'animate-group-pulse' : ''}`}
        style={{ backgroundColor: color }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          {isEditingName ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                // IME変換中は送信しない
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setEditName(name);
                  setIsEditingName(false);
                }
              }}
              className="flex-1 bg-transparent text-white text-sm font-semibold focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
              className="text-white text-sm font-semibold hover:opacity-80 transition-opacity"
            >
              {name}
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleExpand}
              className="p-1 text-white/70 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'}`}>
                <ChevronUp className="w-4 h-4" />
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDisband();
              }}
              className="p-1 text-white/70 hover:text-white transition-all duration-200 hover:scale-110 hover:rotate-90 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stickies - 4つ以上の場合は2列レイアウト */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {stickies.length < 4 && (
            <SortableContext
              items={stickies.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1">
                {stickies.map((sticky, index) => (
                  <SortableGroupedStickyNote
                    key={sticky.id}
                    sticky={sticky}
                    groupId={id}
                    color="#FEF3C7"
                    isAnonymous={isAnonymous}
                    isOwner={sticky.authorId === odclientId}
                    isLiked={sticky.likes.includes(odclientId || '')}
                    onLike={() => onStickyLike(sticky.id)}
                    onEdit={(content) => onStickyEdit(sticky.id, content)}
                    onDelete={() => onStickyDelete(sticky.id)}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          )}
          {stickies.length >= 4 && (
            <SortableContext
              items={stickies.map((s) => s.id)}
              strategy={rectSortingStrategy}
            >
              <div className="columns-2 gap-1 space-y-1">
                {stickies.map((sticky, index) => (
                  <SortableGroupedStickyNote
                    key={sticky.id}
                    sticky={sticky}
                    groupId={id}
                    color="#FEF3C7"
                    isAnonymous={isAnonymous}
                    isOwner={sticky.authorId === odclientId}
                    isLiked={sticky.likes.includes(odclientId || '')}
                    onLike={() => onStickyLike(sticky.id)}
                    onEdit={(content) => onStickyEdit(sticky.id, content)}
                    onDelete={() => onStickyDelete(sticky.id)}
                    index={index}
                    isMasonry
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>

        {/* 折りたたみ時のサマリー */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out
          ${!isExpanded ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="text-white/70 text-xs px-1 py-1">
            {stickies.length}個のアイデア
          </div>
        </div>
      </div>
    </div>
  );
}

interface SortableGroupedStickyNoteProps {
  sticky: Sticky;
  groupId: string;
  color: string;
  isAnonymous?: boolean;
  isOwner: boolean;
  isLiked: boolean;
  onLike: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  index?: number;
  isMasonry?: boolean;
}

function SortableGroupedStickyNote({
  sticky,
  groupId,
  color,
  isAnonymous,
  isOwner,
  isLiked,
  onLike,
  onEdit,
  onDelete,
  index = 0,
  isMasonry = false,
}: SortableGroupedStickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(sticky.content);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sticky.id,
    data: { type: 'grouped-sticky', id: sticky.id, groupId, fromGroup: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeAnimating(true);
    onLike();
    setTimeout(() => setLikeAnimating(false), 600);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'shadow-lg' : ''} cursor-grab active:cursor-grabbing
        transition-all duration-200 ${isMasonry ? 'break-inside-avoid' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div
        className="rounded-[10px] p-2.5 flex flex-col gap-1.5"
        style={{ backgroundColor: color }}
      >
        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={() => {
                if (editContent.trim()) onEdit(editContent.trim());
                setIsEditing(false);
              }}
              onKeyDown={(e) => {
                // IME変換中は送信しない
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (editContent.trim()) onEdit(editContent.trim());
                  setIsEditing(false);
                }
                if (e.key === 'Escape') {
                  setEditContent(sticky.content);
                  setIsEditing(false);
                }
              }}
              className="w-full bg-transparent text-[12px] text-amber-800 leading-relaxed resize-none focus:outline-none"
              rows={2}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-[12px] text-amber-800 leading-relaxed">
              {sticky.content}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          {!isAnonymous && (
            <span className="text-xs text-amber-700/70">{sticky.authorName}</span>
          )}
          {isAnonymous && <span />}

          <div className="flex items-center gap-2">
            <button
              onClick={handleLikeClick}
              className="flex items-center gap-1 text-amber-700/70 hover:text-red-500 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <Heart
                className={`w-3.5 h-3.5 transition-all duration-200
                  ${isLiked ? 'fill-red-500 text-red-500' : ''}
                  ${likeAnimating ? 'animate-heart-beat' : ''}`}
              />
              {sticky.likes.length > 0 && (
                <span className={`text-xs transition-all duration-200 ${likeAnimating ? 'scale-125' : ''}`}>
                  {sticky.likes.length}
                </span>
              )}
            </button>

            {isOwner && !isEditing && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="text-amber-700/50 hover:text-amber-700 transition-all duration-200 hover:scale-125 active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-amber-700/50 hover:text-red-500 transition-all duration-200 hover:scale-125 active:scale-95"
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
