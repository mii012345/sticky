import BoardContent from './BoardContent';

// オプショナルキャッチオールルートの静的パラメータ
export function generateStaticParams() {
  return [{ id: [] }]; // /board にマッチ
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id?: string[] }>;
}) {
  const { id } = await params;
  const boardId = id?.[0] || '';

  // boardId が空でも BoardContent に渡す（クライアントサイドでURLから取得）
  return <BoardContent boardId={boardId} />;
}
