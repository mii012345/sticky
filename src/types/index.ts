import { Timestamp } from 'firebase/firestore';

export interface Board {
  id: string;
  name: string;
  teamName?: string;
  description?: string;
  isAnonymous: boolean;
  timerMinutes?: number;
  timerStartedAt?: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Sticky {
  id: string;
  boardId: string;
  content: string;
  authorId: string;
  authorName: string;
  x: number;
  y: number;
  groupId?: string;
  orderInGroup?: number; // グループ内での並び順（0から始まる）
  color?: string;
  likes: string[];
  isArchived?: boolean; // アーカイブ（ゴミ箱）フラグ
  archivedAt?: Timestamp; // アーカイブ日時
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Group {
  id: string;
  boardId: string;
  name: string;
  x: number;
  y: number;
  createdAt: Timestamp;
}

export interface Participant {
  id: string;
  boardId: string;
  odclientId: string;
  nickname: string;
  avatarColor: string;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
}

// クライアント側で使用する型（Timestampをnumberに変換）
export interface BoardClient extends Omit<Board, 'createdAt' | 'updatedAt' | 'timerStartedAt'> {
  createdAt: number;
  updatedAt: number;
  timerStartedAt?: number;
}

export interface StickyClient extends Omit<Sticky, 'createdAt' | 'updatedAt' | 'archivedAt'> {
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
}

export interface GroupClient extends Omit<Group, 'createdAt'> {
  createdAt: number;
}

export interface ParticipantClient extends Omit<Participant, 'joinedAt' | 'lastActiveAt'> {
  joinedAt: number;
  lastActiveAt: number;
}

// アバターの色オプション
export const AVATAR_COLORS = [
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#F472B6', // Pink
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#6366F1', // Indigo
] as const;

// 付箋のデフォルト色
export const STICKY_COLORS = [
  '#FEF3C7', // Yellow (default)
  '#DBEAFE', // Blue
  '#D1FAE5', // Green
  '#FCE7F3', // Pink
  '#E0E7FF', // Indigo
  '#FED7AA', // Orange
] as const;
