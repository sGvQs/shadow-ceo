'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { generateBoard } from '@/lib/game/board';
import { generateDevCardDeck } from '@/lib/game/devCards';
import { PLAYER_COLORS } from '@/types/game';

// ランダムな参加コードを生成 (6文字)
function generateGameCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ゲームを作成
export async function createGame() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('認証が必要です');
    }

    const user = await currentUser();
    const displayName = user?.firstName || user?.username || 'プレイヤー';

    // ユニークなコードを生成
    let code = generateGameCode();
    let attempts = 0;
    while (attempts < 10) {
        const existing = await prisma.gameSession.findUnique({ where: { code } });
        if (!existing) break;
        code = generateGameCode();
        attempts++;
    }

    // ゲームとホストプレイヤーを作成
    const game = await prisma.gameSession.create({
        data: {
            code,
            boardState: generateBoard() as unknown as object,
            players: {
                create: {
                    clerkUserId: userId,
                    displayName,
                    color: PLAYER_COLORS[0],
                    isHost: true,
                },
            },
        },
        include: { players: true },
    });

    redirect(`/lobby/${game.code}`);
}

// ゲームに参加
export async function joinGame(code: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('認証が必要です');
    }

    const user = await currentUser();
    const displayName = user?.firstName || user?.username || 'プレイヤー';

    // ゲームを検索
    const game = await prisma.gameSession.findUnique({
        where: { code: code.toUpperCase() },
        include: { players: true },
    });

    if (!game) {
        return { error: 'ゲームが見つかりません' };
    }

    if (game.status !== 'LOBBY') {
        return { error: 'このゲームは既に開始されています' };
    }

    if (game.players.length >= 6) {
        return { error: 'このゲームは満員です（最大6人）' };
    }

    // 既に参加しているか確認
    const existingPlayer = game.players.find(p => p.clerkUserId === userId);
    if (existingPlayer) {
        redirect(`/lobby/${game.code}`);
    }

    // 使用されていないカラーを選択
    const usedColors = game.players.map(p => p.color);
    const availableColor = PLAYER_COLORS.find(c => !usedColors.includes(c)) || PLAYER_COLORS[0];

    // プレイヤーを追加
    await prisma.player.create({
        data: {
            gameId: game.id,
            clerkUserId: userId,
            displayName,
            color: availableColor,
        },
    });

    redirect(`/lobby/${game.code}`);
}

// ゲームを開始（ホストのみ）
export async function startGame(gameId: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('認証が必要です');
    }

    const game = await prisma.gameSession.findUnique({
        where: { id: gameId },
        include: { players: true },
    });

    if (!game) {
        throw new Error('ゲームが見つかりません');
    }

    const hostPlayer = game.players.find(p => p.isHost && p.clerkUserId === userId);
    if (!hostPlayer) {
        throw new Error('ホストのみがゲームを開始できます');
    }

    if (game.players.length < 2) {
        return { error: '2人以上のプレイヤーが必要です' };
    }

    // プレイヤーの順番をシャッフル
    const shuffledPlayerIds = game.players
        .map(p => p.id)
        .sort(() => Math.random() - 0.5);

    // ゲームを投資フェーズに移行
    await prisma.gameSession.update({
        where: { id: gameId },
        data: {
            status: 'INVESTING',
            turnOrder: shuffledPlayerIds,
            currentTurnPlayerId: shuffledPlayerIds[0],
            devCardDeck: generateDevCardDeck() as unknown as object,
        },
    });

    redirect(`/invest/${gameId}`);
}

// ロビーを離脱
export async function leaveGame(gameId: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('認証が必要です');
    }

    const player = await prisma.player.findFirst({
        where: { gameId, clerkUserId: userId },
        include: { game: { include: { players: true } } },
    });

    if (!player) {
        redirect('/lobby');
        return;
    }

    // ホストが離脱する場合
    if (player.isHost) {
        // 他のプレイヤーがいれば次のプレイヤーをホストに
        const otherPlayers = player.game.players.filter(p => p.id !== player.id);
        if (otherPlayers.length > 0) {
            await prisma.$transaction([
                prisma.player.delete({ where: { id: player.id } }),
                prisma.player.update({
                    where: { id: otherPlayers[0].id },
                    data: { isHost: true },
                }),
            ]);
        } else {
            // 最後のプレイヤーならゲームを削除
            await prisma.gameSession.delete({ where: { id: gameId } });
        }
    } else {
        await prisma.player.delete({ where: { id: player.id } });
    }

    redirect('/lobby');
}

// 自分の参加中ゲームを取得
export async function getMyGames() {
    const { userId } = await auth();
    if (!userId) {
        return [];
    }

    const players = await prisma.player.findMany({
        where: { clerkUserId: userId },
        include: {
            game: {
                include: {
                    players: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return players.map(p => ({
        ...p.game,
        myPlayer: p,
    }));
}
