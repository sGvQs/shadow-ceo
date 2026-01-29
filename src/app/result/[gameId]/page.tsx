import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultDisplay } from "@/components/result/ResultDisplay";
import { RANDOM_BONUS_INFO } from "@/types/game";
import type { RandomBonusType } from "@/types/game";

interface ResultPageProps {
    params: Promise<{ gameId: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
    const { gameId } = await params;
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
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

    if (!game) {
        notFound();
    }

    // ステータスチェック
    if (game.status !== 'FINISHED') {
        if (game.status === 'LOBBY') {
            redirect(`/lobby/${game.code}`);
        }
        if (game.status === 'INVESTING') {
            redirect(`/invest/${gameId}`);
        }
        if (game.status === 'PLAYING') {
            redirect(`/game/${gameId}`);
        }
    }

    const currentPlayer = game.players.find(p => p.clerkUserId === userId);
    if (!currentPlayer) {
        redirect("/lobby");
    }

    const bonusInfo = game.randomBonusEvent
        ? RANDOM_BONUS_INFO[game.randomBonusEvent as RandomBonusType]
        : null;

    const winner = game.players.find(p => p.id === game.winnerPlayerId);

    // 結果データを整形
    const playersData = game.players.map((p, index) => ({
        id: p.id,
        displayName: p.displayName,
        color: p.color,
        businessPoints: p.businessPoints,
        finalMoney: p.finalMoney ?? 0,
        rank: index + 1,
        isWinner: p.id === game.winnerPlayerId,
        isCurrentPlayer: p.id === currentPlayer.id,
        receivedFrom: p.receivedInvestments.map(inv => ({
            investorName: inv.investor.displayName,
            investorColor: inv.investor.color,
            percentage: inv.percentage,
        })),
        investedTo: p.investments.map(inv => {
            const target = game.players.find(pl => pl.id === inv.targetPlayerId);
            return {
                targetName: target?.displayName ?? '',
                targetColor: target?.color ?? '',
                percentage: inv.percentage,
            };
        }),
    }));

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
                        <Badge variant="outline">ゲーム終了</Badge>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <ResultDisplay
                    players={playersData}
                    bonusType={game.randomBonusEvent as RandomBonusType | null}
                    bonusInfo={bonusInfo}
                    winnerName={winner?.displayName ?? ''}
                    winnerColor={winner?.color ?? ''}
                />
            </main>
        </div>
    );
}
