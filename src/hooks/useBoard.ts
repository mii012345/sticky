'use client';

import { useState, useEffect, useCallback } from 'react';
import { Board, Sticky, Group, Participant } from '@/types';
import {
  subscribeToBoardChanges,
  subscribeToStickies,
  subscribeToGroups,
  subscribeToParticipants,
  createSticky,
  updateSticky,
  deleteSticky,
  toggleLike,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderStickiesInGroup,
} from '@/lib/firestore';

interface UseBoardReturn {
  board: Board | null;
  stickies: Sticky[];
  groups: Group[];
  participants: Participant[];
  loading: boolean;
  error: string | null;
  addSticky: (content: string, x: number, y: number, groupId?: string) => Promise<void>;
  updateStickyPosition: (stickyId: string, x: number, y: number) => Promise<void>;
  updateStickyContent: (stickyId: string, content: string) => Promise<void>;
  updateStickyGroup: (stickyId: string, groupId: string | undefined) => Promise<void>;
  removeSticky: (stickyId: string) => Promise<void>;
  likeSticky: (stickyId: string) => Promise<void>;
  addGroup: (name: string, x: number, y: number) => Promise<string>;
  updateGroupName: (groupId: string, name: string) => Promise<void>;
  updateGroupPosition: (groupId: string, x: number, y: number) => Promise<void>;
  removeGroup: (groupId: string) => Promise<void>;
  reorderGroupStickies: (stickyIds: string[], groupId: string) => Promise<void>;
}

export function useBoard(
  boardId: string,
  odclientId: string | null,
  nickname: string
): UseBoardReturn {
  const [board, setBoard] = useState<Board | null>(null);
  const [stickies, setStickies] = useState<Sticky[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) return;

    setLoading(true);
    setError(null);

    const unsubscribeBoard = subscribeToBoardChanges(boardId, (boardData) => {
      if (!boardData) {
        setError('ボードが見つかりません');
        setLoading(false);
        return;
      }
      setBoard(boardData);
      setLoading(false);
    });

    const unsubscribeStickies = subscribeToStickies(boardId, setStickies);
    const unsubscribeGroups = subscribeToGroups(boardId, setGroups);
    const unsubscribeParticipants = subscribeToParticipants(boardId, setParticipants);

    return () => {
      unsubscribeBoard();
      unsubscribeStickies();
      unsubscribeGroups();
      unsubscribeParticipants();
    };
  }, [boardId]);

  const addSticky = useCallback(
    async (content: string, x: number, y: number, groupId?: string) => {
      if (!odclientId || !boardId) return;
      await createSticky({
        boardId,
        content,
        authorId: odclientId,
        authorName: nickname,
        x,
        y,
        groupId,
      });
    },
    [boardId, odclientId, nickname]
  );

  const updateStickyPosition = useCallback(
    async (stickyId: string, x: number, y: number) => {
      await updateSticky(stickyId, { x, y });
    },
    []
  );

  const updateStickyContent = useCallback(
    async (stickyId: string, content: string) => {
      await updateSticky(stickyId, { content });
    },
    []
  );

  const updateStickyGroup = useCallback(
    async (stickyId: string, groupId: string | undefined) => {
      await updateSticky(stickyId, { groupId });
    },
    []
  );

  const removeSticky = useCallback(async (stickyId: string) => {
    await deleteSticky(stickyId);
  }, []);

  const likeSticky = useCallback(
    async (stickyId: string) => {
      if (!odclientId) return;
      await toggleLike(stickyId, odclientId);
    },
    [odclientId]
  );

  const addGroup = useCallback(
    async (name: string, x: number, y: number) => {
      if (!boardId) throw new Error('Board ID is required');
      return await createGroup({ boardId, name, x, y });
    },
    [boardId]
  );

  const updateGroupName = useCallback(
    async (groupId: string, name: string) => {
      await updateGroup(groupId, { name });
    },
    []
  );

  const updateGroupPosition = useCallback(
    async (groupId: string, x: number, y: number) => {
      await updateGroup(groupId, { x, y });
    },
    []
  );

  const removeGroup = useCallback(async (groupId: string) => {
    await deleteGroup(groupId);
  }, []);

  const reorderGroupStickies = useCallback(
    async (stickyIds: string[], groupId: string) => {
      await reorderStickiesInGroup(stickyIds, groupId);
    },
    []
  );

  return {
    board,
    stickies,
    groups,
    participants,
    loading,
    error,
    addSticky,
    updateStickyPosition,
    updateStickyContent,
    updateStickyGroup,
    removeSticky,
    likeSticky,
    addGroup,
    updateGroupName,
    updateGroupPosition,
    removeGroup,
    reorderGroupStickies,
  };
}
