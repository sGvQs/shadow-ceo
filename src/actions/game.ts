'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { rollDice, getTilesForDice } from '@/lib/game/board';
import {
    addResources,
    subtractResources,
    exchangeGold,
    applyTaxInspection,
    canBuild,
} from '@/lib/game/resources';
import { BUILD_COSTS, BUILD_BP, WIN_CONDITION_BP } from '@/types/game';
import type { ResourceState, ResourceType, BoardState, HexTile, Office, Road, DevCardType } from '@/types/game';

// ダイスロール
export async function performDiceRoll(gameId: string) {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('認証が必要です');
    }

    const game = await prisma.gameSession.findUnique({
        where: { id: gameId },
        include: { players: true },
    });

    if (!game || game.status !== 'PLAYING') {
        throw new Error('ゲームが見つからないか、プレイ中ではありません');
    }

    const currentPlayer = game.players.find(p => p.clerkUserId === userId);
    if (!currentPlayer || game.currentTurnPlayerId !== currentPlayer.id) {
        throw new Error('あなたのターンではありません');
    }

    const diceResult = rollDice();
    const boardState = game.boardState as unknown as BoardState;

    // 7の目: 税務署の調査
    if (diceResult.sum === 7) {
        // 金4枚以上持っているプレイヤーから半分没収
        const updates = game.players.map(async (player) => {
            const resources = player.resourceState as unknown as ResourceState;
            const { newResources, goldLost } = applyTaxInspection(resources);

            if (goldLost > 0) {
                await prisma.player.update({
                    where: { id: player.id },
                    data: { resourceState: newResources as unknown as object },
                });

                // ログ記録
                await prisma.gameLog.create({
                    data: {
                        gameId,
                        playerId: player.id,
                        action: 'TAX_COLLECTED',
                        data: { goldLost },
                    },
                });
            }
        });
        await Promise.all(updates);
    } else {
        // 通常: リソース配布
        const producingTiles = getTilesForDice(boardState, diceResult.sum);

        for (const tile of producingTiles) {
            if (tile.resourceType === 'desert') continue;

            // このタイルに隣接するオフィスを持つプレイヤーにリソースを配布
            for (const office of boardState.offices) {
                // 簡略化: オフィスの位置がこのタイルに関連するかチェック
                if (office.position.hexId === tile.id) {
                    const player = game.players.find(p => p.id === office.playerId);
                    if (player) {
                        const resources = player.resourceState as unknown as ResourceState;
                        const amount = office.level === 'enterprise' ? 2 : 1;
                        const newResources = addResources(resources, { [tile.resourceType]: amount });

                        await prisma.player.update({
                            where: { id: player.id },
                            data: { resourceState: newResources as unknown as object },
                        });
                    }
                }
            }
        }
    }

    // ログ記録
    await prisma.gameLog.create({
        data: {
            gameId,
            playerId: currentPlayer.id,
            action: 'DICE_ROLL',
            data: { dice1: diceResult.dice1, dice2: diceResult.dice2, sum: diceResult.sum },
        },
    });

    revalidatePath(`/game/${gameId}`);
    return diceResult;
}

// 金の交換
export async function performExchangeGold(gameId: string, targetResource: ResourceType) {
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

    const resources = currentPlayer.resourceState as unknown as ResourceState;
    const newResources = exchangeGold(resources, targetResource);

    if (!newResources) {
        return { error: '金が足りません（2枚必要）' };
    }

    await prisma.player.update({
        where: { id: currentPlayer.id },
        data: { resourceState: newResources as unknown as object },
    });

    await prisma.gameLog.create({
        data: {
            gameId,
            playerId: currentPlayer.id,
            action: 'EXCHANGE_GOLD',
            data: { targetResource },
        },
    });

    revalidatePath(`/game/${gameId}`);
    return { success: true };
}

// 建設
export async function performBuild(
    gameId: string,
    buildType: 'road' | 'startup' | 'devCard',
    position?: { hexId: string; direction: number }
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

    const resources = currentPlayer.resourceState as unknown as ResourceState;

    if (!canBuild(resources, buildType)) {
        return { error: 'リソースが足りません' };
    }

    const newResources = subtractResources(resources, BUILD_COSTS[buildType]);
    let newBP = currentPlayer.businessPoints + BUILD_BP[buildType];
    const boardState = game.boardState as unknown as BoardState;

    // 建設物を盤面に追加
    if (buildType === 'road' && position) {
        const road: Road = {
            id: `road-${Date.now()}`,
            playerId: currentPlayer.id,
            position: { hexId: position.hexId, direction: position.direction as 0 | 1 | 2 | 3 | 4 | 5 },
        };
        boardState.roads.push(road);
    } else if (buildType === 'startup' && position) {
        const office: Office = {
            id: `office-${Date.now()}`,
            playerId: currentPlayer.id,
            position: { hexId: position.hexId, direction: position.direction as 0 | 1 | 2 | 3 | 4 | 5 },
            level: 'startup',
        };
        boardState.offices.push(office);
    } else if (buildType === 'devCard') {
        // 指示カードをデッキから引く
        const deck = game.devCardDeck as unknown as { type: DevCardType; id: string }[];
        if (deck.length > 0) {
            const card = deck.pop();
            if (card) {
                const playerDevCards = currentPlayer.devCards as unknown as { type: DevCardType; id: string; isUsed: boolean }[];
                playerDevCards.push({ ...card, isUsed: false });

                await prisma.player.update({
                    where: { id: currentPlayer.id },
                    data: { devCards: playerDevCards as unknown as object },
                });

                await prisma.gameSession.update({
                    where: { id: gameId },
                    data: { devCardDeck: deck as unknown as object },
                });
            }
        }
    }

    // プレイヤー更新
    await prisma.player.update({
        where: { id: currentPlayer.id },
        data: {
            resourceState: newResources as unknown as object,
            businessPoints: newBP,
            roads: buildType === 'road' ? (boardState.roads.filter(r => r.playerId === currentPlayer.id) as unknown as object) : undefined,
            offices: buildType === 'startup' ? (boardState.offices.filter(o => o.playerId === currentPlayer.id) as unknown as object) : undefined,
        },
    });

    // 盤面更新
    await prisma.gameSession.update({
        where: { id: gameId },
        data: { boardState: boardState as unknown as object },
    });

    // ログ記録
    await prisma.gameLog.create({
        data: {
            gameId,
            playerId: currentPlayer.id,
            action: `BUILD_${buildType.toUpperCase()}`,
            data: { position },
        },
    });

    // 勝利条件チェック
    if (newBP >= WIN_CONDITION_BP) {
        await prisma.gameSession.update({
            where: { id: gameId },
            data: { status: 'FINISHED' },
        });
        redirect(`/result/${gameId}`);
    }

    revalidatePath(`/game/${gameId}`);
    return { success: true };
}

// 警官移動（買収）
export async function moveCop(gameId: string, targetTileId: string, isBribe: boolean) {
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

    const resources = currentPlayer.resourceState as unknown as ResourceState;
    const boardState = game.boardState as unknown as BoardState;

    // 買収の場合は金3枚必要
    if (isBribe) {
        if (resources.gold < 3) {
            return { error: '金が足りません（買収に3枚必要）' };
        }

        const newResources = subtractResources(resources, { gold: 3 });
        await prisma.player.update({
            where: { id: currentPlayer.id },
            data: { resourceState: newResources as unknown as object },
        });
    }

    // 警官を移動
    boardState.tiles.forEach(tile => {
        tile.hasCop = tile.id === targetTileId;
    });
    boardState.copTileId = targetTileId;

    await prisma.gameSession.update({
        where: { id: gameId },
        data: { boardState: boardState as unknown as object },
    });

    await prisma.gameLog.create({
        data: {
            gameId,
            playerId: currentPlayer.id,
            action: 'COP_MOVE',
            data: { targetTileId, isBribe },
        },
    });

    revalidatePath(`/game/${gameId}`);
    return { success: true };
}

// ターン終了
export async function endTurn(gameId: string) {
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

    // 次のプレイヤーを決定
    const turnOrder = game.turnOrder;
    const currentIndex = turnOrder.indexOf(currentPlayer.id);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    const nextPlayerId = turnOrder[nextIndex];

    await prisma.gameSession.update({
        where: { id: gameId },
        data: { currentTurnPlayerId: nextPlayerId },
    });

    await prisma.gameLog.create({
        data: {
            gameId,
            playerId: currentPlayer.id,
            action: 'END_TURN',
            data: {},
        },
    });

    revalidatePath(`/game/${gameId}`);
    return { success: true };
}
