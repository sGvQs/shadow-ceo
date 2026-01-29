"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type ActionResult = {
    success: boolean;
    message?: string;
    error?: string;
    arrested?: boolean;
    footprintFound?: boolean;
};

// 隣接マスを計算する関数
function getAdjacentCells(pos: number): number[] {
    const row = Math.floor(pos / 3);
    const col = pos % 3;
    const adjacent: number[] = [];

    if (row > 0) adjacent.push(pos - 3); // 上
    if (row < 2) adjacent.push(pos + 3); // 下
    if (col > 0) adjacent.push(pos - 1); // 左
    if (col < 2) adjacent.push(pos + 1); // 右

    return adjacent;
}

// 方向から新しい位置を計算
function getNewPosition(
    pos: number,
    direction: "up" | "down" | "left" | "right" | "stay"
): number | null {
    if (direction === "stay") return pos;

    const row = Math.floor(pos / 3);
    const col = pos % 3;

    switch (direction) {
        case "up":
            return row > 0 ? pos - 3 : null;
        case "down":
            return row < 2 ? pos + 3 : null;
        case "left":
            return col > 0 ? pos - 1 : null;
        case "right":
            return col < 2 ? pos + 1 : null;
        default:
            return null;
    }
}

// 現在のユーザーとプレイヤーを取得
async function getCurrentPlayerInGame(gameId: string) {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        throw new Error("認証されていません");
    }

    const user = await db.user.findUnique({
        where: { clerkId },
    });

    if (!user) {
        throw new Error("ユーザーが見つかりません");
    }

    const player = await db.player.findFirst({
        where: {
            userId: user.id,
            groupId: gameId,
        },
    });

    if (!player) {
        throw new Error("このゲームに参加していません");
    }

    return { user, player };
}

// 泥棒の移動
export async function thiefMoveAction(
    gameId: string,
    direction: "up" | "down" | "left" | "right" | "stay"
): Promise<ActionResult> {
    try {
        const { player } = await getCurrentPlayerInGame(gameId);

        if (player.role !== "THIEF") {
            return { success: false, error: "泥棒のみ移動できます" };
        }

        const game = await db.group.findUnique({
            where: { id: gameId },
        });

        if (!game) {
            return { success: false, error: "ゲームが見つかりません" };
        }

        if (game.status !== "PLAYING") {
            return { success: false, error: "ゲームが進行中ではありません" };
        }

        const newPos = getNewPosition(game.thiefPos, direction);

        if (newPos === null) {
            return { success: false, error: "その方向には移動できません" };
        }

        // 足跡を更新
        const footprints = (game.footprints as { pos: number; turn: number }[]) || [];
        footprints.push({ pos: newPos, turn: game.turnCount + 1 });

        // ゲーム状態を更新
        const newTurnCount = game.turnCount + 1;
        const isGameOver = newTurnCount >= game.maxTurns;

        await db.group.update({
            where: { id: gameId },
            data: {
                thiefPos: newPos,
                turnCount: newTurnCount,
                footprints: footprints,
                lastAction:
                    direction === "stay"
                        ? "泥棒はその場に留まった"
                        : "泥棒が移動した",
                status: isGameOver ? "FINISHED" : "PLAYING",
            },
        });

        revalidatePath(`/game/${gameId}`);

        if (isGameOver) {
            return {
                success: true,
                message: "🎉 15ターン逃げ切った！泥棒の勝利！",
            };
        }

        return {
            success: true,
            message:
                direction === "stay" ? "その場に留まりました" : "移動しました",
        };
    } catch (error) {
        console.error("Thief move error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "エラーが発生しました",
        };
    }
}

// 警察の移動
export async function copMoveAction(
    gameId: string,
    direction: "up" | "down" | "left" | "right"
): Promise<ActionResult> {
    try {
        const { player } = await getCurrentPlayerInGame(gameId);

        if (player.role !== "COP") {
            return { success: false, error: "警察のみ移動できます" };
        }

        const game = await db.group.findUnique({
            where: { id: gameId },
        });

        if (!game) {
            return { success: false, error: "ゲームが見つかりません" };
        }

        if (game.status !== "PLAYING") {
            return { success: false, error: "ゲームが進行中ではありません" };
        }

        // 最初の警察コマを移動（簡略化のため）
        const currentPos = game.copPos[0];
        if (currentPos === undefined) {
            return { success: false, error: "警察の位置が不明です" };
        }

        const newPos = getNewPosition(currentPos, direction);

        if (newPos === null) {
            return { success: false, error: "その方向には移動できません" };
        }

        // 警察の位置を更新
        const newCopPos = [...game.copPos];
        newCopPos[0] = newPos;

        await db.group.update({
            where: { id: gameId },
            data: {
                copPos: newCopPos,
                lastAction: "警察が移動した",
            },
        });

        revalidatePath(`/game/${gameId}`);

        return { success: true, message: "移動しました" };
    } catch (error) {
        console.error("Cop move error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "エラーが発生しました",
        };
    }
}

// 警察の検査
export async function copInspectAction(gameId: string): Promise<ActionResult> {
    try {
        const { player } = await getCurrentPlayerInGame(gameId);

        if (player.role !== "COP") {
            return { success: false, error: "警察のみ検査できます" };
        }

        const game = await db.group.findUnique({
            where: { id: gameId },
        });

        if (!game) {
            return { success: false, error: "ゲームが見つかりません" };
        }

        if (game.status !== "PLAYING") {
            return { success: false, error: "ゲームが進行中ではありません" };
        }

        const copPosition = game.copPos[0];
        const footprints = (game.footprints as { pos: number; turn: number }[]) || [];

        // 過去3ターン以内の足跡を確認
        const recentFootprints = footprints.filter(
            (f) => f.pos === copPosition && game.turnCount - f.turn <= 3
        );

        const hasFootprint = recentFootprints.length > 0;

        await db.group.update({
            where: { id: gameId },
            data: {
                lastAction: hasFootprint
                    ? "🔍 警察が現在地を検査した... 足跡を発見！"
                    : "🔍 警察が現在地を検査した... 何も見つからなかった",
            },
        });

        revalidatePath(`/game/${gameId}`);

        return {
            success: true,
            message: hasFootprint ? "👣 足跡を発見しました！" : "何も見つかりませんでした",
            footprintFound: hasFootprint,
        };
    } catch (error) {
        console.error("Cop inspect error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "エラーが発生しました",
        };
    }
}

// 警察の逮捕
export async function copArrestAction(
    gameId: string,
    targetPos: number
): Promise<ActionResult> {
    try {
        const { player } = await getCurrentPlayerInGame(gameId);

        if (player.role !== "COP") {
            return { success: false, error: "警察のみ逮捕できます" };
        }

        const game = await db.group.findUnique({
            where: { id: gameId },
        });

        if (!game) {
            return { success: false, error: "ゲームが見つかりません" };
        }

        if (game.status !== "PLAYING") {
            return { success: false, error: "ゲームが進行中ではありません" };
        }

        // 隣接マスかどうか確認
        const copPosition = game.copPos[0];
        const adjacentCells = getAdjacentCells(copPosition);

        if (!adjacentCells.includes(targetPos) && targetPos !== copPosition) {
            return { success: false, error: "隣接するマスのみ逮捕できます" };
        }

        // 泥棒がそこにいるか確認
        const arrested = game.thiefPos === targetPos;

        if (arrested) {
            await db.group.update({
                where: { id: gameId },
                data: {
                    status: "FINISHED",
                    lastAction: "🚔 警察が泥棒を逮捕した！警察の勝利！",
                },
            });
        } else {
            await db.group.update({
                where: { id: gameId },
                data: {
                    lastAction: `🚔 警察がマス${targetPos}を逮捕しようとした... 空振り！`,
                },
            });
        }

        revalidatePath(`/game/${gameId}`);

        return {
            success: true,
            message: arrested ? "🎉 泥棒を逮捕しました！" : "空振りでした...",
            arrested,
        };
    } catch (error) {
        console.error("Cop arrest error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "エラーが発生しました",
        };
    }
}
