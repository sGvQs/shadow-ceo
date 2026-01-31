/**
 * Room Code Join API Route
 * POST: コードでルームに参加
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/auth/utils';
import { prisma } from '@/server/db/db';

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
        const { code } = body;

        if (!code || code.trim() === '') {
            return NextResponse.json(
                { error: 'ルームコードは必須です' },
                { status: 400 }
            );
        }

        const room = await prisma.room.findUnique({
            where: { code: code.toUpperCase().trim() },
            include: {
                players: true,
            },
        });

        if (!room) {
            return NextResponse.json(
                { error: 'ルームが見つかりません' },
                { status: 404 }
            );
        }

        if (!room.isActive) {
            return NextResponse.json(
                { error: 'このルームは終了しています' },
                { status: 400 }
            );
        }

        if (room.players.length >= room.maxPlayers) {
            return NextResponse.json(
                { error: 'ルームが満員です' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            id: room.id,
            name: room.name,
            code: room.code,
            maxPlayers: room.maxPlayers,
            currentPlayers: room.players.length,
        });
    } catch (error) {
        console.error('ルーム検索エラー:', error);
        return NextResponse.json(
            { error: 'ルームの検索に失敗しました' },
            { status: 500 }
        );
    }
}
