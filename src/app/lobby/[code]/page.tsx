import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LobbyActions } from "@/components/lobby/LobbyActions";

interface LobbyRoomPageProps {
    params: Promise<{ code: string }>;
}

export default async function LobbyRoomPage({ params }: LobbyRoomPageProps) {
    const { code } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const game = await prisma.gameSession.findUnique({
        where: { code: code.toUpperCase() },
        include: {
            players: {
                orderBy: { createdAt: 'asc' },
            },
        },
    });

    if (!game) {
        notFound();
    }

    // 既にゲームが開始されている場合はリダイレクト
    if (game.status === 'INVESTING') {
        redirect(`/invest/${game.id}`);
    }
    if (game.status === 'PLAYING') {
        redirect(`/game/${game.id}`);
    }
    if (game.status === 'FINISHED') {
        redirect(`/result/${game.id}`);
    }

    const currentPlayer = game.players.find(p => p.clerkUserId === userId);
    const isHost = currentPlayer?.isHost ?? false;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/lobby">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            Shadow CEO
                        </h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <Badge variant="secondary" className="mb-4">待機中</Badge>
                        <h2 className="text-3xl font-bold mb-2">ゲームロビー</h2>
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-slate-400">参加コード:</span>
                            <span className="text-4xl font-mono font-bold text-amber-400 tracking-widest">
                                {game.code}
                            </span>
                        </div>
                        <p className="text-slate-500 mt-2 text-sm">
                            このコードを他のプレイヤーに共有してください
                        </p>
                    </div>

                    {/* プレイヤーリスト */}
                    <Card className="bg-slate-800/50 border-slate-700 mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>参加プレイヤー</span>
                                <span className="text-base font-normal text-slate-400">
                                    {game.players.length} / 6
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {game.players.map((player) => (
                                <div
                                    key={player.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: player.color }}
                                        />
                                        <span className="font-medium">{player.displayName}</span>
                                        {player.isHost && (
                                            <Badge variant="outline" className="text-amber-400 border-amber-400">
                                                👑 ホスト
                                            </Badge>
                                        )}
                                        {player.id === currentPlayer?.id && (
                                            <Badge variant="secondary">あなた</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* 空きスロット */}
                            {Array.from({ length: 6 - game.players.length }).map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="flex items-center p-3 rounded-lg border-2 border-dashed border-slate-700 text-slate-600"
                                >
                                    <span>空きスロット</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* アクションボタン */}
                    <LobbyActions
                        gameId={game.id}
                        isHost={isHost}
                        playerCount={game.players.length}
                    />
                </div>
            </main>
        </div>
    );
}
