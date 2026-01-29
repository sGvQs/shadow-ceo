'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

// 投資を確定
export async function submitInvestments(
    gameId: string,
    investments: { targetPlayerId: string; percentage: number }[]
) {
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

    if (game.status !== 'INVESTING') {
        throw new Error('投資フェーズではありません');
    }

    const currentPlayer = game.players.find(p => p.clerkUserId === userId);
    if (!currentPlayer) {
        throw new Error('このゲームに参加していません');
    }

    if (currentPlayer.isReady) {
        return { error: '既に投資を確定しています' };
    }

    // 合計が100%かチェック
    const totalPercentage = investments.reduce((sum, inv) => sum + inv.percentage, 0);
    if (totalPercentage !== 100) {
        return { error: '投資の合計は100%である必要があります' };
    }

    // 有効な投資対象かチェック
    const validPlayerIds = game.players.map(p => p.id);
    for (const inv of investments) {
        if (!validPlayerIds.includes(inv.targetPlayerId)) {
            return { error: '無効な投資対象が含まれています' };
        }
    }

    // トランザクションで投資を作成し、プレイヤーをReady状態に
    await prisma.$transaction(async (tx) => {
        // 既存の投資を削除（再設定の場合）
        await tx.investment.deleteMany({
            where: { investorId: currentPlayer.id },
        });

        // 新しい投資を作成（0%のものは除外）
        const investmentsToCreate = investments
            .filter(inv => inv.percentage > 0)
            .map(inv => ({
                investorId: currentPlayer.id,
                targetPlayerId: inv.targetPlayerId,
                percentage: inv.percentage,
            }));

        if (investmentsToCreate.length > 0) {
            await tx.investment.createMany({
                data: investmentsToCreate,
            });
        }

        // プレイヤーをReady状態に
        await tx.player.update({
            where: { id: currentPlayer.id },
            data: { isReady: true },
        });
    });

    // 全員がReadyかチェック
    const updatedGame = await prisma.gameSession.findUnique({
        where: { id: gameId },
        include: { players: true },
    });

    if (updatedGame && updatedGame.players.every(p => p.isReady)) {
        // 全員Ready -> ゲームフェーズに移行
        await prisma.gameSession.update({
            where: { id: gameId },
            data: { status: 'PLAYING' },
        });

        redirect(`/game/${gameId}`);
    }

    return { success: true };
}

// 投資状況を取得
export async function getInvestmentStatus(gameId: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('認証が必要です');
    }

    const game = await prisma.gameSession.findUnique({
        where: { id: gameId },
        include: {
            players: {
                include: {
                    investments: true,
                },
            },
        },
    });

    if (!game) {
        throw new Error('ゲームが見つかりません');
    }

    const currentPlayer = game.players.find(p => p.clerkUserId === userId);
    if (!currentPlayer) {
        throw new Error('このゲームに参加していません');
    }

    // 自分の投資情報のみ返す
    return {
        players: game.players.map(p => ({
            id: p.id,
            displayName: p.displayName,
            color: p.color,
            isReady: p.isReady,
            isCurrentPlayer: p.id === currentPlayer.id,
        })),
        myInvestments: currentPlayer.investments.map(inv => ({
            targetPlayerId: inv.targetPlayerId,
            percentage: inv.percentage,
        })),
        isReady: currentPlayer.isReady,
        allReady: game.players.every(p => p.isReady),
    };
}
