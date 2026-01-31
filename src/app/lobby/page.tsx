/**
 * ロビー画面 (Server Component)
 * 初期データを取得してClient Componentに渡す
 */

import LobbyClient from '@/frontend/components/Lobby/LobbyClient';
import { getRooms } from '@/backend/services/rooms';
import { getCurrentUser } from '@/backend/db/getCurrentUser';

// キャッシュを無効化（常に最新のルームリストを取得）
export const dynamic = 'force-dynamic';

export default async function LobbyPage() {
    const rooms = await getRooms();
    const user = await getCurrentUser();

    return <LobbyClient initialRooms={rooms} user={user} />;
}
