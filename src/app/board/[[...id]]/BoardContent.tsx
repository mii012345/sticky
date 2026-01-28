'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent, rectIntersection, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Header, FloatingInput, InviteDialog, TrashDialog, NicknameDialog, ClickHint, StickyNote, NoteGroup, ZoomControls } from '@/components';
import { useBoard } from '@/hooks/useBoard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCanvasTransform } from '@/hooks/useCanvasTransform';
import { Sticky, Group } from '@/types';
import { joinBoard } from '@/lib/firestore';

// グループカラー
const GROUP_COLORS = ['#8B5CF6', '#14B8A6', '#F472B6', '#3B82F6', '#F59E0B', '#EF4444'];

interface BoardContentProps {
  boardId: string;
}

export default function BoardContent({ boardId: initialBoardId }: BoardContentProps) {
  // クライアントサイドでURLからボードIDを取得（静的エクスポート対応）
  const pathname = usePathname();
  const boardId = initialBoardId || pathname?.split('/board/')?.[1]?.replace(/\/$/, '') || '';
  const [storedUser, setStoredUser] = useLocalStorage<{ odclientId: string; nickname: string } | null>(
    'sticky-user',
    null
  );
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showTrashDialog, setShowTrashDialog] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<{ type: string; id: string; fromGroup?: boolean } | null>(null);
  // 最前面に表示する要素のID（直近で触った付箋またはグループ）
  const [frontElementId, setFrontElementId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ズーム・パン機能
  const {
    scale,
    position,
    isPanning,
    canvasElement,
    canvasCallbackRef,
    handleMouseDown: handlePanMouseDown,
    handleMouseMove: handlePanMouseMove,
    handleMouseUp: handlePanMouseUp,
    handleMouseLeave: handlePanMouseLeave,
    zoomIn,
    zoomOut,
    resetTransform,
    setTransform,
    screenToCanvas,
  } = useCanvasTransform();

  const odclientId = storedUser?.odclientId || null;
  const nickname = storedUser?.nickname || '';

  // ドラッグ開始までの距離を設定（クリックとドラッグを区別）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const {
    board,
    stickies,
    archivedStickies,
    groups,
    participants,
    loading,
    error,
    addSticky,
    updateStickyPosition,
    updateStickyContent,
    updateStickyGroup,
    archiveStickyNote,
    restoreStickyNote,
    likeSticky,
    addGroup,
    updateGroupName,
    updateGroupPosition,
    removeGroup,
    reorderGroupStickies,
  } = useBoard(boardId, odclientId, nickname);

  // ニックネーム未設定時はダイアログを表示
  useEffect(() => {
    if (!loading && board && !storedUser) {
      setShowNicknameDialog(true);
    }
  }, [loading, board, storedUser]);

  const handleJoin = async (newNickname: string) => {
    try {
      const { odclientId: newOdclientId } = await joinBoard(boardId, newNickname);
      setStoredUser({ odclientId: newOdclientId, nickname: newNickname });
      setShowNicknameDialog(false);
    } catch (error) {
      console.error('Failed to join board:', error);
    }
  };

  const handleAddSticky = useCallback(
    (content: string) => {
      // キャンバスの中央付近にランダムに追加（ズーム・パンを考慮）
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // 画面中央をキャンバス座標に変換し、そこにランダムオフセットを加える
        const canvasPos = screenToCanvas(
          rect.left + centerX + (Math.random() - 0.5) * 300,
          rect.top + centerY + (Math.random() - 0.5) * 200,
          rect
        );
        addSticky(content, canvasPos.x, canvasPos.y);
      } else {
        // フォールバック
        const x = 50 + Math.random() * 600;
        const y = 50 + Math.random() * 300;
        addSticky(content, x, y);
      }
    },
    [addSticky, screenToCanvas]
  );

  // 画面にフィット機能
  const handleFitToScreen = useCallback(() => {
    if (!canvasElement) return;

    // 付箋とグループのバウンディングボックスを計算
    const STICKY_WIDTH = 180;
    const STICKY_HEIGHT = 120;
    const GROUP_WIDTH = 220;
    const GROUP_MIN_HEIGHT = 100;

    // コンテンツがない場合はリセット
    if (stickies.length === 0 && groups.length === 0) {
      resetTransform();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // グループ外の付箋
    const ungrouped = stickies.filter((s) => !s.groupId);
    ungrouped.forEach((sticky) => {
      minX = Math.min(minX, sticky.x);
      minY = Math.min(minY, sticky.y);
      maxX = Math.max(maxX, sticky.x + STICKY_WIDTH);
      maxY = Math.max(maxY, sticky.y + STICKY_HEIGHT);
    });

    // グループ
    groups.forEach((group) => {
      const groupStickies = stickies.filter((s) => s.groupId === group.id);
      const groupHeight = Math.max(GROUP_MIN_HEIGHT, groupStickies.length * 60 + 80);
      minX = Math.min(minX, group.x);
      minY = Math.min(minY, group.y);
      maxX = Math.max(maxX, group.x + GROUP_WIDTH);
      maxY = Math.max(maxY, group.y + groupHeight);
    });

    // コンテンツがない場合（全て空）
    if (minX === Infinity) {
      resetTransform();
      return;
    }

    // キャンバスのサイズを取得
    const rect = canvasElement.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    // コンテンツのサイズ
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // パディング（余白）
    const padding = 60;

    // スケールを計算（コンテンツが画面に収まるように）
    const scaleX = (canvasWidth - padding * 2) / contentWidth;
    const scaleY = (canvasHeight - padding * 2) / contentHeight;
    const newScale = Math.min(Math.max(0.25, Math.min(scaleX, scaleY)), 1.5);

    // コンテンツをキャンバス中央に配置するための位置を計算
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;
    const newX = canvasWidth / 2 - contentCenterX * newScale;
    const newY = canvasHeight / 2 - contentCenterY * newScale;

    setTransform(newScale, { x: newX, y: newY });
  }, [canvasElement, stickies, groups, resetTransform, setTransform]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // キャンバス上でクリックした位置に付箋を追加
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 既存の付箋やグループをクリックした場合は何もしない
      if ((e.target as HTMLElement).closest('[data-sticky]') || (e.target as HTMLElement).closest('[data-group]')) {
        return;
      }

      // 簡単な付箋追加（テスト用）
      // 実際はポップアップで内容を入力
    },
    []
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    const dragData = active.data.current as { type: string; id: string; fromGroup?: boolean } | null;
    setActiveDragData(dragData);

    // 直近で触った要素を最前面に表示
    if (dragData?.type === 'sticky') {
      setFrontElementId(`sticky-${dragData.id}`);
    } else if (dragData?.type === 'group') {
      setFrontElementId(`group-${dragData.id}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveId(null);
    setActiveDragData(null);

    if (!active) return;

    const activeData = active.data.current;
    const overId = over?.id as string | undefined;
    const overData = over?.data.current;

    // グループをドラッグした場合（overは不要 - 単純な位置移動）
    if (activeData?.type === 'group') {
      const groupId = activeData.id;
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const newX = group.x + delta.x;
      const newY = group.y + delta.y;
      await updateGroupPosition(groupId, newX, newY);
      return;
    }

    // 付箋の単純移動（グループ外、overなし）
    if (activeData?.type === 'sticky' && !over) {
      const stickyId = activeData.id;
      const sticky = stickies.find((s) => s.id === stickyId);
      if (sticky && !sticky.groupId) {
        const newX = sticky.x + delta.x;
        const newY = sticky.y + delta.y;
        await updateStickyPosition(stickyId, newX, newY);
      }
      return;
    }

    // グループ内の付箋をグループ外にドラッグした場合（overなし）
    if (activeData?.type === 'grouped-sticky' && activeData.fromGroup && !over) {
      const stickyId = activeData.id;
      const sticky = stickies.find((s) => s.id === stickyId);
      if (sticky && sticky.groupId) {
        const group = groups.find((g) => g.id === sticky.groupId);
        if (group) {
          const newX = group.x + delta.x;
          const newY = group.y + delta.y;
          await updateStickyGroup(stickyId, undefined);
          await updateStickyPosition(stickyId, newX, newY);
        }
      }
      return;
    }

    // 以下は over が必要な処理
    if (!over) return;

    // グループ内の付箋を並べ替えた場合
    if (activeData?.type === 'grouped-sticky' && overData?.type === 'grouped-sticky') {
      const activeId = activeData.id;
      const overId = overData.id;
      const groupId = activeData.groupId;

      // 同じグループ内での並べ替え
      if (groupId && groupId === overData.groupId && activeId !== overId) {
        const groupStickies = getGroupStickies(groupId);
        const oldIndex = groupStickies.findIndex((s) => s.id === activeId);
        const newIndex = groupStickies.findIndex((s) => s.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(groupStickies, oldIndex, newIndex);
          const stickyIds = newOrder.map((s) => s.id);
          await reorderGroupStickies(stickyIds, groupId);
        }
        return;
      }

      // 別のグループ内の付箋にドロップ → そのグループに移動
      if (groupId && overData.groupId && groupId !== overData.groupId) {
        const stickyId = activeData.id;
        await updateStickyGroup(stickyId, overData.groupId);
        return;
      }
    }

    // グループ内の付箋を別のグループのドロップゾーンにドロップ
    if (activeData?.type === 'grouped-sticky' && overId?.startsWith('group-')) {
      const stickyId = activeData.id;
      const targetGroupId = overData?.id;
      const sourceGroupId = activeData.groupId;

      // 別のグループに移動（同じグループの場合は何もしない）
      if (targetGroupId && sourceGroupId !== targetGroupId) {
        await updateStickyGroup(stickyId, targetGroupId);
        return;
      }
    }

    // グループ内の付箋をグループ外にドラッグした場合
    if (activeData?.type === 'grouped-sticky' && activeData.fromGroup) {
      const stickyId = activeData.id;
      const sticky = stickies.find((s) => s.id === stickyId);
      if (!sticky || !sticky.groupId) return;

      // 別の付箋の上にドロップしていない場合はグループから取り出す
      if (!overData?.type || (overData.type !== 'grouped-sticky' && overData.type !== 'sticky')) {
        const group = groups.find((g) => g.id === sticky.groupId);
        if (group) {
          const newX = group.x + delta.x;
          const newY = group.y + delta.y;
          await updateStickyGroup(stickyId, undefined);
          await updateStickyPosition(stickyId, newX, newY);
        }
      }
      return;
    }

    // 付箋をドラッグした場合
    if (activeData?.type === 'sticky') {
      const stickyId = activeData.id;
      const sticky = stickies.find((s) => s.id === stickyId);
      if (!sticky) return;

      // グループにドロップした場合
      if (overId?.startsWith('group-')) {
        const groupId = overData?.id;
        if (groupId && sticky.groupId !== groupId) {
          await updateStickyGroup(stickyId, groupId);
        }
        return;
      }

      // グループ内の付箋にドロップした場合 → そのグループに追加
      if (overData?.type === 'grouped-sticky' && overData.groupId) {
        const groupId = overData.groupId;
        if (sticky.groupId !== groupId) {
          await updateStickyGroup(stickyId, groupId);
        }
        return;
      }

      // 別の付箋にドロップした場合（新しいグループを作成）
      if (overData?.type === 'sticky' && overData.id && overData.id !== stickyId) {
        const targetStickyId = overData.id;
        const targetSticky = stickies.find((s) => s.id === targetStickyId);
        if (targetSticky && !sticky.groupId && !targetSticky.groupId) {
          // 新しいグループを作成
          const groupId = await addGroup('新しいグループ', targetSticky.x, targetSticky.y);
          await updateStickyGroup(stickyId, groupId);
          await updateStickyGroup(targetStickyId, groupId);
        }
        return;
      }

      // グループ内の付箋をグループ外にドラッグした場合
      if (activeData.fromGroup && sticky.groupId) {
        const group = groups.find((g) => g.id === sticky.groupId);
        if (group) {
          // グループの位置を基準に新しい位置を計算
          const newX = group.x + delta.x;
          const newY = group.y + delta.y;
          await updateStickyGroup(stickyId, undefined);
          await updateStickyPosition(stickyId, newX, newY);
        }
        return;
      }

      // グループ外の付箋を単純に移動
      if (!sticky.groupId) {
        const newX = sticky.x + delta.x;
        const newY = sticky.y + delta.y;
        await updateStickyPosition(stickyId, newX, newY);
      }
    }
  };

  const handleDisbandGroup = async (groupId: string) => {
    // グループ内の付箋を解除
    const groupStickies = stickies.filter((s) => s.groupId === groupId);
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    // 付箋を散らばらせる
    for (let i = 0; i < groupStickies.length; i++) {
      const sticky = groupStickies[i];
      const offsetX = (i % 3) * 100;
      const offsetY = Math.floor(i / 3) * 100;
      await updateStickyGroup(sticky.id, undefined);
      await updateStickyPosition(sticky.id, group.x + offsetX, group.y + offsetY);
    }

    // グループを削除
    await removeGroup(groupId);
  };

  // グループ外の付箋
  const ungroupedStickies = stickies.filter((s) => !s.groupId);

  // グループごとの付箋をまとめる（orderInGroupでソート）
  const getGroupStickies = (groupId: string) => {
    const groupStickies = stickies.filter((s) => s.groupId === groupId);
    // orderInGroup でソート（未設定の場合は末尾に）
    return groupStickies.sort((a, b) => {
      const orderA = a.orderInGroup ?? Infinity;
      const orderB = b.orderInGroup ?? Infinity;
      if (orderA === orderB) {
        // 同じ order なら createdAt で比較
        return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);
      }
      return orderA - orderB;
    });
  };

  // boardId が空の場合（クライアントサイドでまだ取得中）
  if (!boardId) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500">読み込み中...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500">読み込み中...</div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-red-500">{error || 'ボードが見つかりません'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 gap-8">
      {/* Header */}
      <Header
        boardName={board.name}
        teamName={board.teamName}
        stickyCount={stickies.length}
        archivedCount={archivedStickies.length}
        isAnonymous={board.isAnonymous}
        participants={participants}
        onInviteClick={() => setShowInviteDialog(true)}
        onTrashClick={() => setShowTrashDialog(true)}
      />

      {/* Canvas */}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={(node) => {
            canvasRef.current = node;
            canvasCallbackRef(node);
          }}
          className="flex-1 relative rounded-2xl bg-zinc-50 border border-zinc-200 overflow-hidden"
          style={{
            minHeight: '560px',
            cursor: isPanning ? 'grabbing' : undefined,
            touchAction: 'none', // ブラウザのデフォルトジェスチャーを無効化
          }}
          onClick={handleCanvasClick}
          onMouseDown={handlePanMouseDown}
          onMouseMove={handlePanMouseMove}
          onMouseUp={handlePanMouseUp}
          onMouseLeave={handlePanMouseLeave}
        >
          {/* Transformable Canvas Content */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              pointerEvents: isPanning ? 'none' : 'auto',
            }}
          >
            {/* Groups */}
            {groups.map((group, index) => (
              <NoteGroup
                key={group.id}
                id={group.id}
                name={group.name}
                x={group.x}
                y={group.y}
                color={GROUP_COLORS[index % GROUP_COLORS.length]}
                stickies={getGroupStickies(group.id)}
                isAnonymous={board.isAnonymous}
                odclientId={odclientId}
                isBroughtToFront={frontElementId === `group-${group.id}`}
                onNameChange={(name) => updateGroupName(group.id, name)}
                onDisband={() => handleDisbandGroup(group.id)}
                onStickyLike={likeSticky}
                onStickyEdit={updateStickyContent}
                onStickyDelete={archiveStickyNote}
              />
            ))}

            {/* Ungrouped Stickies */}
            {ungroupedStickies.map((sticky) => (
              <StickyNote
                key={sticky.id}
                id={sticky.id}
                content={sticky.content}
                authorName={sticky.authorName}
                likes={sticky.likes.length}
                isLiked={sticky.likes.includes(odclientId || '')}
                isOwner={sticky.authorId === odclientId}
                isAnonymous={board.isAnonymous}
                x={sticky.x}
                y={sticky.y}
                isBroughtToFront={frontElementId === `sticky-${sticky.id}`}
                onLike={() => likeSticky(sticky.id)}
                onEdit={(content) => updateStickyContent(sticky.id, content)}
                onDelete={() => archiveStickyNote(sticky.id)}
              />
            ))}

            {/* Click Hint */}
            {stickies.length === 0 && <ClickHint />}
          </div>

          {/* UI Controls (not affected by transform) */}
          <FloatingInput onSubmit={handleAddSticky} />
          <ZoomControls
            scale={scale}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetTransform}
            onFit={handleFitToScreen}
          />
        </div>

        {/* ドラッグ中のオーバーレイ */}
        <DragOverlay dropAnimation={null}>
          {activeId && activeDragData?.type === 'sticky' && (() => {
            const sticky = stickies.find((s) => s.id === activeDragData.id);
            if (!sticky) return null;
            return (
              <div className="w-[180px] animate-drag-float">
                <div
                  className="rounded-xl p-4 flex flex-col gap-2.5 shadow-2xl ring-2 ring-violet-300/50"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <p className="text-[13px] text-amber-800 leading-relaxed">{sticky.content}</p>
                  <div className="flex items-center justify-between">
                    {!board.isAnonymous && sticky.authorName && (
                      <span className="text-xs text-amber-700/70">{sticky.authorName}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
          {activeId && activeDragData?.type === 'grouped-sticky' && (() => {
            const sticky = stickies.find((s) => s.id === activeDragData.id);
            if (!sticky) return null;
            return (
              <div className="w-[140px] animate-drag-float">
                <div
                  className="rounded-[10px] p-2.5 flex flex-col gap-1.5 shadow-2xl ring-2 ring-violet-300/50"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <p className="text-[12px] text-amber-800 leading-relaxed">{sticky.content}</p>
                </div>
              </div>
            );
          })()}
          {activeId && activeDragData?.type === 'group' && (() => {
            const group = groups.find((g) => g.id === activeDragData.id);
            if (!group) return null;
            const groupStickies = stickies.filter((s) => s.groupId === group.id);
            const index = groups.indexOf(group);
            return (
              <div
                className="w-[220px] rounded-2xl p-3 flex flex-col gap-2 shadow-2xl animate-drag-float ring-2 ring-white/30"
                style={{ backgroundColor: GROUP_COLORS[index % GROUP_COLORS.length] }}
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-white text-sm font-semibold">{group.name}</span>
                </div>
                <div className="text-white/70 text-xs px-1">
                  {groupStickies.length}個のアイデア
                </div>
              </div>
            );
          })()}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      {showNicknameDialog && <NicknameDialog onSubmit={handleJoin} />}
      {showInviteDialog && (
        <InviteDialog boardId={boardId} onClose={() => setShowInviteDialog(false)} />
      )}
      {showTrashDialog && (
        <TrashDialog
          archivedStickies={archivedStickies}
          onRestore={restoreStickyNote}
          onClose={() => setShowTrashDialog(false)}
        />
      )}
    </div>
  );
}
