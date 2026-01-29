import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { InvestmentForm } from "@/components/invest/InvestmentForm";

interface InvestPageProps {
    params: Promise<{ gameId: string }>;
}

export default async function InvestPage({ params }: InvestPageProps) {
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
                },
                orderBy: { createdAt: 'asc' },
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
    if (game.status === 'PLAYING') {
        redirect(`/game/${gameId}`);
    }
    if (game.status === 'FINISHED') {
        redirect(`/result/${gameId}`);
    }

    const currentPlayer = game.players.find(p => p.clerkUserId === userId);
    if (!currentPlayer) {
        redirect("/lobby");
    }

    // 自分の投資情報
    const myInvestments = currentPlayer.investments.reduce((acc, inv) => {
        acc[inv.targetPlayerId] = inv.percentage;
        return acc;
    }, {} as Record<string, number>);

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
                        <Badge>投資フェーズ</Badge>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2">💰 投資フェーズ</h2>
                        <p className="text-slate-400">
                            初期資金100%を各プレイヤーに分配してください
                        </p>
                        <p className="text-slate-500 text-sm mt-2">
                            この投資情報はゲーム終了まで他プレイヤーには非公開です
                        </p>
                    </div>

                    <InvestmentForm
                        gameId={gameId}
                        players={game.players.map(p => ({
                            id: p.id,
                            displayName: p.displayName,
                            color: p.color,
                            isCurrentPlayer: p.id === currentPlayer.id,
                            isReady: p.isReady,
                        }))}
                        initialInvestments={myInvestments}
                        isReady={currentPlayer.isReady}
                    />
                </div>
            </main>
        </div>
    );
}
