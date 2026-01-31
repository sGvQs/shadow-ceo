/**
 * Room API Route
 * GET: ルーム一覧取得
 * POST: 新規ルーム作成
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/server/auth/utils';

// ランダムなルームコードを生成
function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET: アクティブなルーム一覧を取得
export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            where: { isActive: true },
            include: {
                players: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const roomList = rooms.map((room) => ({
            id: room.id,
            name: room.name,
            code: room.code,
            maxPlayers: room.maxPlayers,
            currentPlayers: room.players.length,
            isActive: room.isActive,
            createdAt: room.createdAt.toISOString(),
        }));

        return NextResponse.json({ rooms: roomList });
    } catch (error) {
        console.error('ルーム一覧取得エラー:', error);
        return NextResponse.json(
            { error: 'ルーム一覧の取得に失敗しました' },
            { status: 500 }
        );
    }
}

// POST: 新規ルームを作成
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUser();


        if (!userId) {
            return NextResponse.json(
                { error: '認証が必要です' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, maxPlayers = 5 } = body;

        if (!name || name.trim() === '') {
            return NextResponse.json(
                { error: 'ルーム名は必須です' },
                { status: 400 }
            );
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

        return NextResponse.json({
            id: room.id,
            name: room.name,
            code: room.code,
            maxPlayers: room.maxPlayers,
            currentPlayers: 0,
            isActive: room.isActive,
        });
    } catch (error) {
        console.error('ルーム作成エラー:', error);
        return NextResponse.json(
            { error: 'ルームの作成に失敗しました' },
            { status: 500 }
        );
    }
}
