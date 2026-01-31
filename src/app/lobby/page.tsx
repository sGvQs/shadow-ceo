/**
 * ロビー画面 (Server Component)
 * 初期データを取得してClient Componentに渡す
 */

import LobbyClient from '@/frontend/components/Lobby/LobbyClient';
import { getRooms } from '@/backend/services/rooms';

// キャッシュを無効化（常に最新のルームリストを取得）
export const dynamic = 'force-dynamic';

export default async function LobbyPage() {
    const rooms = await getRooms();

    return <LobbyClient initialRooms={rooms} />;
}
