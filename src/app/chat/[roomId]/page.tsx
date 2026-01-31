/**
 * チャットルーム画面 (Server Component)
 * 認証ユーザーの取得とクライアントコンポーネントの呼び出し
 */

import { getCurrentUser } from '@/backend/db/getCurrentUser';
import ChatClient from '@/frontend/components/Chat/ChatClient';

interface ChatRoomPageProps {
    params: Promise<{ roomId: string }>;
}

export default async function ChatRoomPage({ params }: ChatRoomPageProps) {
    const { roomId } = await params;
    const user = await getCurrentUser();

    const parsedRoomId = parseInt(roomId, 10);

    return <ChatClient user={user} roomId={parsedRoomId} />;
}
