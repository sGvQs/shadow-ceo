import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyGames, createGame } from "@/actions/lobby";
import { JoinGameForm } from "@/components/lobby/JoinGameForm";

const STATUS_LABELS = {
    LOBBY: { label: "待機中", variant: "secondary" as const },
    INVESTING: { label: "投資中", variant: "default" as const },
    PLAYING: { label: "プレイ中", variant: "default" as const },
    FINISHED: { label: "終了", variant: "outline" as const },
};

export default async function LobbyPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }

    const myGames = await getMyGames();

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/">
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
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">ゲームロビー</h2>

                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        {/* 新規ゲーム作成 */}
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">🎮</span>
                                    新規ゲーム
                                </CardTitle>
                                <CardDescription>
                                    新しいゲームを作成してホストになります
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form action={createGame}>
                                    <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                                        ゲームを作成
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* ゲームに参加 */}
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span className="text-2xl">🔗</span>
                                    ゲームに参加
                                </CardTitle>
                                <CardDescription>
                                    参加コードを入力して既存のゲームに参加
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <JoinGameForm />
                            </CardContent>
                        </Card>
                    </div>

                    {/* 参加中のゲーム */}
                    {myGames.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold mb-4">参加中のゲーム</h3>
                            <div className="space-y-4">
                                {myGames.map((game) => {
                                    const status = STATUS_LABELS[game.status];
                                    const gameUrl = game.status === 'LOBBY'
                                        ? `/lobby/${game.code}`
                                        : game.status === 'INVESTING'
                                            ? `/invest/${game.id}`
                                            : game.status === 'PLAYING'
                                                ? `/game/${game.id}`
                                                : `/result/${game.id}`;

                                    return (
                                        <Card key={game.id} className="bg-slate-800/30 border-slate-700 hover:border-slate-600 transition-colors">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-2xl font-mono font-bold text-amber-400">
                                                        {game.code}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={status.variant}>{status.label}</Badge>
                                                            <span className="text-slate-400 text-sm">
                                                                {game.players.length}人参加中
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-slate-500 mt-1">
                                                            {game.myPlayer.isHost && (
                                                                <span className="text-amber-400">👑 ホスト</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link href={gameUrl}>
                                                    <Button variant="outline">
                                                        {game.status === 'LOBBY' ? '入室する' : '続ける'}
                                                    </Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {myGames.length === 0 && (
                        <div className="text-center text-slate-500 py-12">
                            <p className="text-lg">参加中のゲームはありません</p>
                            <p className="text-sm mt-2">新しいゲームを作成するか、参加コードを入力してください</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
