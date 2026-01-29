import { getWaitingGames, getMyGames } from "@/actions/game";
import { CreateGameForm } from "./create-game-form";
import { GameCard } from "./game-card";
import Link from "next/link";

export default async function LobbyPage() {
    const [waitingGames, myGames] = await Promise.all([
        getWaitingGames(),
        getMyGames(),
    ]);

    // 進行中の自分のゲーム
    const activeGames = myGames.filter((g) => g.status === "PLAYING");

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Active Games */}
            {activeGames.length > 0 && (
                <section className="mb-12">
                    <h2 className="mb-4 flex items-center gap-2">
                        <span className="loading-pencil">✏️</span>
                        進行中のゲーム
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {activeGames.map((game) => (
                            <Link
                                key={game.id}
                                href={`/game/${game.id}`}
                                className="paper-card block hover:translate-y-[-2px] transition-transform"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span
                                        className={`role-badge ${game.myRole === "THIEF" ? "role-badge-thief" : "role-badge-cop"}`}
                                    >
                                        {game.myRole === "THIEF" ? "🎭 泥棒" : "🚔 警察"}
                                    </span>
                                    <span className="text-ink-faint text-sm">
                                        ターン {game.turnCount}/{game.maxTurns}
                                    </span>
                                </div>
                                <p className="text-ink-light text-sm mt-2">
                                    👆 タップしてゲームに戻る
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Create Game */}
            <section className="mb-12">
                <h2 className="mb-4">🎲 新規ゲーム作成</h2>
                <CreateGameForm />
            </section>

            {/* Waiting Games */}
            <section>
                <h2 className="mb-4">🕐 待機中のゲーム</h2>
                {waitingGames.length === 0 ? (
                    <div className="paper-card text-center text-ink-faint py-12">
                        <p className="text-4xl mb-4">📝</p>
                        <p>待機中のゲームはありません</p>
                        <p className="text-sm mt-2">新しいゲームを作成してみましょう！</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {waitingGames.map((game) => (
                            <GameCard key={game.id} game={game} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
