"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 待機中のゲーム一覧を取得
export async function getWaitingGames() {
    const games = await db.group.findMany({
        where: {
            status: "WAITING",
        },
        include: {
            players: {
                include: {
                    user: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 20,
    });

    return games;
}

// 新規ゲームを作成
export async function createGameAction(role: "THIEF" | "COP") {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        throw new Error("認証されていません");
    }

    const user = await db.user.findUnique({
        where: { clerkId },
    });

    if (!user) {
        throw new Error("ユーザーが見つかりません。再ログインしてください。");
    }

    // 新規グループを作成
    const game = await db.group.create({
        data: {
            status: "WAITING",
            thiefPos: 4, // 中央からスタート
            copPos: [],
            footprints: [],
            players: {
                create: {
                    userId: user.id,
                    role: role,
                },
            },
        },
        include: {
            players: {
                include: {
                    user: true,
                },
            },
        },
    });

    revalidatePath("/lobby");

    return game;
}

// ゲームに参加
export async function joinGameAction(gameId: string, role: "THIEF" | "COP") {
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

    // ゲームが存在し、WAITINGか確認
    const game = await db.group.findUnique({
        where: { id: gameId },
        include: {
            players: true,
        },
    });

    if (!game) {
        throw new Error("ゲームが見つかりません");
    }

    if (game.status !== "WAITING") {
        throw new Error("このゲームは既に開始されています");
    }

    // 既に参加していないか確認
    const existingPlayer = game.players.find((p) => p.userId === user.id);
    if (existingPlayer) {
        throw new Error("既にこのゲームに参加しています");
    }

    // 同じロールが既にいないか確認
    const sameRolePlayer = game.players.find((p) => p.role === role);
    if (sameRolePlayer) {
        throw new Error(`${role === "THIEF" ? "泥棒" : "警察"}は既に選択されています`);
    }

    // プレイヤーを追加
    await db.player.create({
        data: {
            userId: user.id,
            groupId: gameId,
            role: role,
        },
    });

    // 2人揃ったらゲーム開始
    const updatedGame = await db.group.findUnique({
        where: { id: gameId },
        include: { players: true },
    });

    if (updatedGame && updatedGame.players.length >= 2) {
        // 泥棒と警察が両方いるか確認
        const hasThief = updatedGame.players.some((p) => p.role === "THIEF");
        const hasCop = updatedGame.players.some((p) => p.role === "COP");

        if (hasThief && hasCop) {
            // 警察の初期位置を設定（角の2つ）
            await db.group.update({
                where: { id: gameId },
                data: {
                    status: "PLAYING",
                    copPos: [0, 8], // 左上と右下
                },
            });
        }
    }

    revalidatePath("/lobby");
    revalidatePath(`/game/${gameId}`);

    return updatedGame;
}

// ゲームを削除（作成者のみ）
export async function deleteGameAction(gameId: string) {
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

    const game = await db.group.findUnique({
        where: { id: gameId },
        include: { players: true },
    });

    if (!game) {
        throw new Error("ゲームが見つかりません");
    }

    // 作成者（最初のプレイヤー）のみ削除可能
    const creator = game.players[0];
    if (creator?.userId !== user.id) {
        throw new Error("ゲームの作成者のみ削除できます");
    }

    await db.group.delete({
        where: { id: gameId },
    });

    revalidatePath("/lobby");
}

// 自分の参加中ゲームを取得
export async function getMyGames() {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return [];
    }

    const user = await db.user.findUnique({
        where: { clerkId },
    });

    if (!user) {
        return [];
    }

    const players = await db.player.findMany({
        where: {
            userId: user.id,
        },
        include: {
            group: {
                include: {
                    players: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            group: {
                createdAt: "desc",
            },
        },
    });

    return players.map((p) => ({
        ...p.group,
        myRole: p.role,
    }));
}
