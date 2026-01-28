import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteField,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Board, Sticky, Group, Participant, AVATAR_COLORS } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ========== Board Operations ==========

export async function createBoard(data: {
  name: string;
  teamName?: string;
  description?: string;
  isAnonymous: boolean;
  timerMinutes?: number;
  createdBy: string;
}): Promise<string> {
  // undefinedを除外したオブジェクトを作成
  const boardData: Record<string, unknown> = {
    name: data.name,
    isAnonymous: data.isAnonymous,
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (data.teamName) boardData.teamName = data.teamName;
  if (data.description) boardData.description = data.description;
  if (data.timerMinutes) boardData.timerMinutes = data.timerMinutes;

  const boardRef = await addDoc(collection(db, 'boards'), boardData);
  return boardRef.id;
}

export async function getBoard(boardId: string): Promise<Board | null> {
  const boardDoc = await getDoc(doc(db, 'boards', boardId));
  if (!boardDoc.exists()) return null;
  return { id: boardDoc.id, ...boardDoc.data() } as Board;
}

export async function getBoards(): Promise<Board[]> {
  const q = query(
    collection(db, 'boards'),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Board[];
}

export async function getBoardWithStats(boardId: string): Promise<{
  board: Board;
  stickyCount: number;
  participantCount: number;
} | null> {
  const board = await getBoard(boardId);
  if (!board) return null;

  const stickiesQuery = query(
    collection(db, 'stickies'),
    where('boardId', '==', boardId)
  );
  const participantsQuery = query(
    collection(db, 'participants'),
    where('boardId', '==', boardId)
  );

  const [stickiesSnapshot, participantsSnapshot] = await Promise.all([
    getDocs(stickiesQuery),
    getDocs(participantsQuery),
  ]);

  return {
    board,
    stickyCount: stickiesSnapshot.size,
    participantCount: participantsSnapshot.size,
  };
}

export async function getBoardsWithStats(): Promise<Array<{
  board: Board;
  stickyCount: number;
  participantCount: number;
  participants: Participant[];
}>> {
  const boards = await getBoards();

  const boardsWithStats = await Promise.all(
    boards.map(async (board) => {
      const stickiesQuery = query(
        collection(db, 'stickies'),
        where('boardId', '==', board.id)
      );
      const participantsQuery = query(
        collection(db, 'participants'),
        where('boardId', '==', board.id)
      );

      const [stickiesSnapshot, participantsSnapshot] = await Promise.all([
        getDocs(stickiesQuery),
        getDocs(participantsQuery),
      ]);

      const participants = participantsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Participant[];

      return {
        board,
        stickyCount: stickiesSnapshot.size,
        participantCount: participantsSnapshot.size,
        participants,
      };
    })
  );

  return boardsWithStats;
}

// 自分が作成または参加しているボードのみ取得
export async function getMyBoardsWithStats(clientId: string): Promise<Array<{
  board: Board;
  stickyCount: number;
  participantCount: number;
  participants: Participant[];
}>> {
  // 1. 自分が作成したボードを取得
  const createdBoardsQuery = query(
    collection(db, 'boards'),
    where('createdBy', '==', clientId),
    orderBy('updatedAt', 'desc')
  );
  const createdBoardsSnapshot = await getDocs(createdBoardsQuery);
  const createdBoards = createdBoardsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Board[];

  // 2. 自分が参加しているボードのIDを取得
  const participantsQuery = query(
    collection(db, 'participants'),
    where('odclientId', '==', clientId)
  );
  const participantsSnapshot = await getDocs(participantsQuery);
  const participatedBoardIds = participantsSnapshot.docs.map(
    (doc) => doc.data().boardId as string
  );

  // 3. 参加しているボードを取得（作成したボードと重複を除く）
  const createdBoardIds = new Set(createdBoards.map((b) => b.id));
  const uniqueParticipatedBoardIds = participatedBoardIds.filter(
    (id) => !createdBoardIds.has(id)
  );

  let participatedBoards: Board[] = [];
  if (uniqueParticipatedBoardIds.length > 0) {
    // Firestoreの 'in' クエリは最大10件なので、分割して取得
    const chunks = [];
    for (let i = 0; i < uniqueParticipatedBoardIds.length; i += 10) {
      chunks.push(uniqueParticipatedBoardIds.slice(i, i + 10));
    }

    const boardPromises = chunks.map(async (chunk) => {
      const q = query(
        collection(db, 'boards'),
        where('__name__', 'in', chunk)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Board[];
    });

    const results = await Promise.all(boardPromises);
    participatedBoards = results.flat();
  }

  // 4. 全ボードをマージして updatedAt でソート
  const allBoards = [...createdBoards, ...participatedBoards].sort((a, b) => {
    const aTime = a.updatedAt?.toMillis?.() || 0;
    const bTime = b.updatedAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  // 5. 各ボードの統計情報を取得
  const boardsWithStats = await Promise.all(
    allBoards.map(async (board) => {
      const stickiesQuery = query(
        collection(db, 'stickies'),
        where('boardId', '==', board.id)
      );
      const participantsQuery = query(
        collection(db, 'participants'),
        where('boardId', '==', board.id)
      );

      const [stickiesSnapshot, participantsSnapshot] = await Promise.all([
        getDocs(stickiesQuery),
        getDocs(participantsQuery),
      ]);

      const participants = participantsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Participant[];

      return {
        board,
        stickyCount: stickiesSnapshot.size,
        participantCount: participantsSnapshot.size,
        participants,
      };
    })
  );

  return boardsWithStats;
}

export function subscribeToBoardChanges(
  boardId: string,
  callback: (board: Board | null) => void
) {
  return onSnapshot(doc(db, 'boards', boardId), (doc) => {
    if (!doc.exists()) {
      callback(null);
      return;
    }
    callback({ id: doc.id, ...doc.data() } as Board);
  });
}

// ========== Sticky Operations ==========

export async function createSticky(data: {
  boardId: string;
  content: string;
  authorId: string;
  authorName: string;
  x: number;
  y: number;
  groupId?: string;
  color?: string;
}): Promise<string> {
  // undefinedを除外
  const stickyData: Record<string, unknown> = {
    boardId: data.boardId,
    content: data.content,
    authorId: data.authorId,
    authorName: data.authorName,
    x: data.x,
    y: data.y,
    likes: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (data.groupId) stickyData.groupId = data.groupId;
  if (data.color) stickyData.color = data.color;

  const stickyRef = await addDoc(collection(db, 'stickies'), stickyData);
  return stickyRef.id;
}

export async function updateSticky(
  stickyId: string,
  data: Partial<Omit<Sticky, 'id' | 'createdAt'>>
): Promise<void> {
  // undefinedの値をdeleteField()に変換
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      updateData[key] = deleteField();
    } else {
      updateData[key] = value;
    }
  }

  await updateDoc(doc(db, 'stickies', stickyId), updateData);
}

export async function deleteSticky(stickyId: string): Promise<void> {
  await deleteDoc(doc(db, 'stickies', stickyId));
}

export async function archiveSticky(stickyId: string): Promise<void> {
  await updateDoc(doc(db, 'stickies', stickyId), {
    isArchived: true,
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function restoreSticky(stickyId: string): Promise<void> {
  await updateDoc(doc(db, 'stickies', stickyId), {
    isArchived: deleteField(),
    archivedAt: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export async function toggleLike(stickyId: string, odclientId: string): Promise<void> {
  const stickyDoc = await getDoc(doc(db, 'stickies', stickyId));
  if (!stickyDoc.exists()) return;

  const sticky = stickyDoc.data() as Sticky;
  const likes = sticky.likes || [];

  const newLikes = likes.includes(odclientId)
    ? likes.filter((id) => id !== odclientId)
    : [...likes, odclientId];

  await updateDoc(doc(db, 'stickies', stickyId), {
    likes: newLikes,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToStickies(
  boardId: string,
  callback: (stickies: Sticky[]) => void
) {
  const q = query(
    collection(db, 'stickies'),
    where('boardId', '==', boardId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const stickies = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Sticky))
      .filter((sticky) => !sticky.isArchived);
    callback(stickies);
  });
}

export function subscribeToArchivedStickies(
  boardId: string,
  callback: (stickies: Sticky[]) => void
) {
  const q = query(
    collection(db, 'stickies'),
    where('boardId', '==', boardId),
    where('isArchived', '==', true),
    orderBy('archivedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const stickies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Sticky[];
    callback(stickies);
  });
}

// グループ内の付箋の順序を一括更新
export async function reorderStickiesInGroup(
  stickyIds: string[],
  groupId: string
): Promise<void> {
  const updates = stickyIds.map((stickyId, index) =>
    updateDoc(doc(db, 'stickies', stickyId), {
      orderInGroup: index,
      groupId: groupId,
      updatedAt: serverTimestamp(),
    })
  );
  await Promise.all(updates);
}

// ========== Group Operations ==========

export async function createGroup(data: {
  boardId: string;
  name: string;
  x: number;
  y: number;
}): Promise<string> {
  const groupRef = await addDoc(collection(db, 'groups'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return groupRef.id;
}

export async function updateGroup(
  groupId: string,
  data: Partial<Omit<Group, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), data);
}

export async function deleteGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, 'groups', groupId));
}

export function subscribeToGroups(
  boardId: string,
  callback: (groups: Group[]) => void
) {
  const q = query(
    collection(db, 'groups'),
    where('boardId', '==', boardId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Group[];
    callback(groups);
  });
}

// ========== Participant Operations ==========

export async function joinBoard(
  boardId: string,
  nickname: string
): Promise<{ odclientId: string; participantId: string }> {
  const odclientId = uuidv4();
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const participantRef = await addDoc(collection(db, 'participants'), {
    boardId,
    odclientId,
    nickname,
    avatarColor,
    joinedAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });

  return { odclientId, participantId: participantRef.id };
}

export async function updateParticipantActivity(participantId: string): Promise<void> {
  await updateDoc(doc(db, 'participants', participantId), {
    lastActiveAt: serverTimestamp(),
  });
}

export function subscribeToParticipants(
  boardId: string,
  callback: (participants: Participant[]) => void
) {
  const q = query(
    collection(db, 'participants'),
    where('boardId', '==', boardId),
    orderBy('joinedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const participants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Participant[];
    callback(participants);
  });
}

// ========== Timer Operations ==========

export async function startTimer(boardId: string): Promise<void> {
  await updateDoc(doc(db, 'boards', boardId), {
    timerStartedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function resetTimer(boardId: string): Promise<void> {
  await updateDoc(doc(db, 'boards', boardId), {
    timerStartedAt: null,
    updatedAt: serverTimestamp(),
  });
}
