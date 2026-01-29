'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { addResources, subtractResources } from '@/lib/game/resources';
import type { ResourceState, ResourceType, DevCard } from '@/types/game';

// 指示カードを使用
export async function useDevCard(
    gameId: string,
    cardId: string,
    data?: { resource?: ResourceType }
) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('認証が必要です');
    }

    const game = await prisma.gameSession.findUnique({
        where: { id: gameId },
        include: { players: true },
    });

    if (!game || game.status !== 'PLAYING') {
        throw new Error('ゲームが見つかりません');
    }

    const currentPlayer = game.players.find(p => p.clerkUserId === userId);
    if (!currentPlayer || game.currentTurnPlayerId !== currentPlayer.id) {
        return { error: 'あなたのターンではありません' };
    }

    const devCards = currentPlayer.devCards as unknown as DevCard[];
    const card = devCards.find(c => c.id === cardId && !c.isUsed);

    if (!card) {
        return { error: 'カードが見つかりません' };
    }

    let resources = currentPlayer.resourceState as unknown as ResourceState;
    const otherPlayers = game.players.filter(p => p.id !== currentPlayer.id);

    // カード効果を適用
    switch (card.type) {
        case 'insider_trading': {
            // 山札から好きな資源1枚を獲得
            const targetResource = data?.resource || 'food';
            resources = addResources(resources, { [targetResource]: 1 });
            break;
        }

        case 'labor_inspection': {
            // 他全員から「食料」を1枚ずつ奪う
            for (const player of otherPlayers) {
                const playerResources = player.resourceState as unknown as ResourceState;
                if (playerResources.food > 0) {
                    const newPlayerResources = subtractResources(playerResources, { food: 1 });
                    await prisma.player.update({
                        where: { id: player.id },
                        data: { resourceState: newPlayerResources as unknown as object },
                    });
                    resources = addResources(resources, { food: 1 });
                }
            }
            break;
        }

        case 'dx_promotion': {
            // 指定した資源1種を他全員からすべて奪う
            const targetResource = data?.resource || 'food';
            for (const player of otherPlayers) {
                const playerResources = player.resourceState as unknown as ResourceState;
                const amount = playerResources[targetResource];
                if (amount > 0) {
                    const newPlayerResources = subtractResources(playerResources, { [targetResource]: amount });
                    await prisma.player.update({
                        where: { id: player.id },
                        data: { resourceState: newPlayerResources as unknown as object },
                    });
                    resources = addResources(resources, { [targetResource]: amount });
                }
            }
            break;
        }

        case 'personnel_change': {
            // 警官を移動させる（別途処理が必要）
            // ここでは移動可能フラグを立てるだけ
            break;
        }
    }

    // カードを使用済みにマーク
    const updatedDevCards = devCards.map(c =>
        c.id === cardId ? { ...c, isUsed: true } : c
    );
    const newDevCardsUsed = currentPlayer.devCardsUsed + 1;

    // 警察のトップ判定（3枚使用で+2 BP）
    let newBP = currentPlayer.businessPoints;
    let hasPoliceChief = currentPlayer.hasPoliceChief;

    if (newDevCardsUsed >= 3 && !hasPoliceChief) {
        // 他に警察のトップを持っているプレイヤーがいるか確認
        const existingChief = game.players.find(p => p.hasPoliceChief);
        if (!existingChief) {
            hasPoliceChief = true;
            newBP += 2;
        }
    }

    // プレイヤー更新
    await prisma.player.update({
        where: { id: currentPlayer.id },
        data: {
            resourceState: resources as unknown as object,
            devCards: updatedDevCards as unknown as object,
            devCardsUsed: newDevCardsUsed,
            businessPoints: newBP,
            hasPoliceChief,
        },
    });

    // ログ記録
    await prisma.gameLog.create({
        data: {
            gameId,
            playerId: currentPlayer.id,
            action: 'USE_DEV_CARD',
            data: { cardType: card.type, resource: data?.resource },
        },
    });

    revalidatePath(`/game/${gameId}`);
    return { success: true, cardType: card.type };
}
