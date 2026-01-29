import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameBoard } from "@/components/game/GameBoard";
import type { BoardState, ResourceState } from "@/types/game";

interface GamePageProps {
    params: Promise<{ gameId: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
    const { gameId } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const game = await prisma.gameSession.findUnique({
        where: { id: gameId },
        include: {
            players: {
                orderBy: { createdAt: 'asc' },
            },
            gameLog: {
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
        },
    });

    if (!game) {
        notFound();
    }

    // ステータスチェック
    if (game.status === 'LOBBY') {
        redirect(`/lobby/${game.code}`);
    }
    if (game.status === 'INVESTING') {
        redirect(`/invest/${gameId}`);
    }
    if (game.status === 'FINISHED') {
        redirect(`/result/${gameId}`);
    }

    const currentPlayer = game.players.find(p => p.clerkUserId === userId);
    if (!currentPlayer) {
        redirect("/lobby");
    }

    const isMyTurn = game.currentTurnPlayerId === currentPlayer.id;
    const currentTurnPlayer = game.players.find(p => p.id === game.currentTurnPlayerId);
    const boardState = game.boardState as unknown as BoardState;
    const myResources = currentPlayer.resourceState as unknown as ResourceState;

    return (
        <div className="min-h-screen flex flex-col bg-slate-900">
            {/* Header */}
            <header className="border-b border-slate-700 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/lobby">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            Shadow CEO
                        </h1>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Badge className={isMyTurn ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20'}>
                            {isMyTurn ? 'あなたのターン' : `${currentTurnPlayer?.displayName}のターン`}
                        </Badge>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            {/* プレイヤー一覧バー */}
            <div className="border-b border-slate-700 bg-slate-800/50 py-2 overflow-x-auto">
                <div className="container mx-auto px-4">
                    <div className="flex gap-4">
                        {game.players.map((player) => (
                            <div
                                key={player.id}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full ${player.id === game.currentTurnPlayerId
                                    ? 'bg-amber-500/20 border border-amber-500'
                                    : 'bg-slate-700/50'
                                    } ${player.id === currentPlayer.id ? 'ring-2 ring-white/30' : ''}`}
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: player.color }}
                                />
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {player.displayName}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                    {player.businessPoints} BP
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-hidden">
                <GameBoard
                    gameId={gameId}
                    boardState={boardState}
                    players={game.players.map(p => ({
                        id: p.id,
                        displayName: p.displayName,
                        color: p.color,
                        businessPoints: p.businessPoints,
                        isCurrentPlayer: p.id === currentPlayer.id,
                    }))}
                    myResources={myResources}
                    isMyTurn={isMyTurn}
                    gameLog={game.gameLog.map(log => ({
                        id: log.id,
                        action: log.action,
                        data: log.data as Record<string, unknown>,
                        playerId: log.playerId,
                        createdAt: log.createdAt,
                    }))}
                />
            </main>
        </div>
    );
}
