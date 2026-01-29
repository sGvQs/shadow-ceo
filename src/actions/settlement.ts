'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
    selectRandomBonus,
    calculateAllFinalMoney,
    determineWinner,
    determineBonusRecipient,
} from '@/lib/game/settlement';
import { getTotalResources } from '@/lib/game/resources';
import { RANDOM_BONUS_INFO, WIN_CONDITION_BP } from '@/types/game';
import type { ResourceState, RandomBonusType, Road, Office } from '@/types/game';

// ゲームを終了して決算フェーズへ
export async function finishGame(gameId: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('認証が必要です');
    }

    const game = await prisma.gameSession.findUnique({
        where: { id: gameId },
        include: {
            players: {
                include: { investments: true },
            },
        },
    });

    if (!game || game.status !== 'PLAYING') {
        throw new Error('ゲームが見つからないか、プレイ中ではありません');
    }

    // ランダムボーナスを選択
    const bonusType = selectRandomBonus();
    const bonusInfo = RANDOM_BONUS_INFO[bonusType];

    // プレイヤー統計を計算
    const playerStats = game.players.map((player) => {
        const resources = player.resourceState as unknown as ResourceState;
        const roads = player.roads as unknown as Road[];
        const offices = player.offices as unknown as Office[];

        return {
            id: player.id,
            roadCount: roads?.length ?? 0,
            resourceCount: getTotalResources(resources),
            goldCount: resources.gold,
            officeCount: offices?.length ?? 0,
        };
    });

    // ボーナス対象者を決定
    const bonusRecipientId = determineBonusRecipient(bonusType, playerStats);

    // 最終BPを計算（ボーナス適用）
    const finalBPs: Record<string, number> = {};
    for (const player of game.players) {
        let bp = player.businessPoints;
        if (player.id === bonusRecipientId) {
            bp += bonusInfo.bp;
        }
        finalBPs[player.id] = bp;
    }

    // 投資情報を集約
    const allInvestments = game.players.flatMap((p) =>
        p.investments.map((inv) => ({
            investorId: inv.investorId,
            targetPlayerId: inv.targetPlayerId,
            percentage: inv.percentage,
        }))
    );

    // 最終マネーを計算
    const finalMoney = calculateAllFinalMoney(
        game.players.map((p) => p.id),
        allInvestments,
        finalBPs
    );

    // 勝者を決定
    const winner = determineWinner(finalMoney);

    // プレイヤーの最終マネーを更新
    for (const player of game.players) {
        await prisma.player.update({
            where: { id: player.id },
            data: {
                businessPoints: finalBPs[player.id],
                finalMoney: finalMoney[player.id],
            },
        });
    }

    // ゲームを終了状態に更新
    await prisma.gameSession.update({
        where: { id: gameId },
        data: {
            status: 'FINISHED',
            randomBonusEvent: bonusType,
            winnerPlayerId: winner?.winnerId ?? null,
        },
    });

    redirect(`/result/${gameId}`);
}

// 決算データを取得
export async function getSettlementData(gameId: string) {
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
                    receivedInvestments: {
                        include: { investor: true },
                    },
                },
                orderBy: { finalMoney: 'desc' },
            },
        },
    });

    if (!game || game.status !== 'FINISHED') {
        throw new Error('ゲームが見つからないか、終了していません');
    }

    const currentPlayer = game.players.find((p) => p.clerkUserId === userId);
    if (!currentPlayer) {
        throw new Error('このゲームに参加していません');
    }

    // ボーナス情報
    const bonusInfo = game.randomBonusEvent
        ? RANDOM_BONUS_INFO[game.randomBonusEvent as RandomBonusType]
        : null;

    return {
        players: game.players.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            color: p.color,
            businessPoints: p.businessPoints,
            finalMoney: p.finalMoney ?? 0,
            isWinner: p.id === game.winnerPlayerId,
            // 投資情報を開示
            receivedFrom: p.receivedInvestments.map((inv) => ({
                investorName: inv.investor.displayName,
                investorColor: inv.investor.color,
                percentage: inv.percentage,
            })),
            investedTo: p.investments.map((inv) => {
                const target = game.players.find((pl) => pl.id === inv.targetPlayerId);
                return {
                    targetName: target?.displayName ?? '',
                    targetColor: target?.color ?? '',
                    percentage: inv.percentage,
                };
            }),
        })),
        bonusType: game.randomBonusEvent as RandomBonusType | null,
        bonusInfo,
        winnerId: game.winnerPlayerId,
    };
}
