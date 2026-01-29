import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GameBoard } from "./game-board";
import { GameHeader } from "./game-header";
import { ActionPanel } from "./action-panel";
import { syncUserAction } from "@/actions/user";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function GamePage({ params }: Props) {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        redirect("/sign-in");
    }

    // ユーザー同期
    await syncUserAction();

    const { id: gameId } = await params;

    // ゲームとプレイヤー情報を取得
    const game = await db.group.findUnique({
        where: { id: gameId },
        include: {
            players: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!game) {
        notFound();
    }

    // 現在のユーザーのプレイヤー情報を取得
    const user = await db.user.findUnique({
        where: { clerkId },
    });

    if (!user) {
        redirect("/sign-in");
    }

    const currentPlayer = game.players.find((p) => p.userId === user.id);

    if (!currentPlayer) {
        // このゲームに参加していない場合はロビーへ
        redirect("/lobby");
    }

    const isThief = currentPlayer.role === "THIEF";

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <GameHeader
                game={game}
                currentPlayer={currentPlayer}
                isThief={isThief}
            />

            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
                {/* Game Board */}
                <div className="flex justify-center">
                    <GameBoard
                        gameId={game.id}
                        thiefPos={isThief ? game.thiefPos : null}
                        copPos={game.copPos}
                        footprints={[]}
                        isThief={isThief}
                        status={game.status}
                    />
                </div>

                {/* Action Panel */}
                <ActionPanel
                    gameId={game.id}
                    currentPlayer={currentPlayer}
                    game={game}
                    isThief={isThief}
                />
            </div>

            {/* Last Action Log */}
            {game.lastAction && (
                <div className="mt-6 paper-card text-center text-ink-light">
                    <p className="font-notebook text-lg">📋 {game.lastAction}</p>
                </div>
            )}
        </div>
    );
}
