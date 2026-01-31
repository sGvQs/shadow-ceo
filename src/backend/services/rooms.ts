
import { prisma } from '@/backend/db/client';
import { getAuthenticatedUser } from '@/backend/auth/utils';

// ランダムなルームコードを生成
function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export type RoomSummary = {
    id: number;
    name: string;
    code: string;
    maxPlayers: number;
    currentPlayers: number;
    isActive: boolean;
    createdAt: string;
};

// GET: アクティブなルーム一覧を取得
export async function getRooms(): Promise<RoomSummary[]> {
    try {
        const rooms = await prisma.room.findMany({
            where: { isActive: true },
            include: {
                players: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return rooms.map((room) => ({
            id: room.id,
            name: room.name,
            code: room.code,
            maxPlayers: room.maxPlayers,
            currentPlayers: room.players.length,
            isActive: room.isActive,
            createdAt: room.createdAt.toISOString(),
        }));
    } catch (error) {
        console.error('ルーム一覧取得エラー:', error);
        throw new Error('ルーム一覧の取得に失敗しました');
    }
}

// POST: 新規ルームを作成
export async function createRoom(name: string, maxPlayers: number = 5) {
    const userId = await getAuthenticatedUser();

    if (!userId) {
        throw new Error('認証が必要です');
    }

    if (!name || name.trim() === '') {
        throw new Error('ルーム名は必須です');
    }

    // ユニークなルームコードを生成
    let code = generateRoomCode();
    let existingRoom = await prisma.room.findUnique({ where: { code } });
    while (existingRoom) {
        code = generateRoomCode();
        existingRoom = await prisma.room.findUnique({ where: { code } });
    }

    const room = await prisma.room.create({
        data: {
            name: name.trim(),
            code,
            maxPlayers: Math.min(Math.max(2, maxPlayers), 10), // 2〜10人
        },
    });

    return {
        id: room.id,
        name: room.name,
        code: room.code,
        maxPlayers: room.maxPlayers,
        currentPlayers: 0,
        isActive: room.isActive,
    };
}

// JOIN: ルームに参加チェック (実際参加はSocketで行うが、ここでは存在確認と情報取得)
export async function findRoomByCode(code: string) {
    const userId = await getAuthenticatedUser();

    if (!userId) {
        throw new Error('認証が必要です');
    }

    if (!code || code.trim() === '') {
        throw new Error('ルームコードは必須です');
    }

    const room = await prisma.room.findUnique({
        where: { code: code.toUpperCase().trim() },
        include: {
            players: true,
        },
    });

    if (!room) {
        throw new Error('ルームが見つかりません');
    }

    if (!room.isActive) {
        throw new Error('このルームは終了しています');
    }

    if (room.players.length >= room.maxPlayers) {
        throw new Error('ルームが満員です');
    }

    return {
        id: room.id,
        name: room.name,
        code: room.code,
        maxPlayers: room.maxPlayers,
        currentPlayers: room.players.length,
    };
}
