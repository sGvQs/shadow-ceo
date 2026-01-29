import Link from "next/link";

type Player = {
    id: string;
    role: string;
    user: {
        id: string;
        name: string;
        imageUrl: string | null;
    };
};

type Game = {
    id: string;
    status: string;
    turnCount: number;
    maxTurns: number;
};

type Props = {
    game: Game;
    currentPlayer: Player;
    isThief: boolean;
};

export function GameHeader({ game, currentPlayer, isThief }: Props) {
    const statusText = {
        WAITING: "対戦相手を待機中...",
        PLAYING: "ゲーム進行中",
        FINISHED: "ゲーム終了",
    }[game.status] || game.status;

    return (
        <div className="paper-card">
            <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Role Badge */}
                <div
                    className={`role-badge ${isThief ? "role-badge-thief" : "role-badge-cop"}`}
                >
                    {isThief ? "🎭 泥棒" : "🚔 警察"}
                    <span className="text-sm opacity-75">({currentPlayer.user.name})</span>
                </div>

                {/* Turn Counter */}
                <div className="text-center">
                    <div className="font-notebook text-2xl text-ink">
                        ターン {game.turnCount} / {game.maxTurns}
                    </div>
                    <div className="text-sm text-ink-faint">{statusText}</div>
                </div>

                {/* Back to Lobby */}
                <Link
                    href="/lobby"
                    className="btn btn-outline text-sm px-3 py-1"
                >
                    ← ロビーに戻る
                </Link>
            </div>

            {/* Win conditions reminder */}
            <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--color-grid)]">
                <p className="text-center text-sm text-ink-faint">
                    {isThief
                        ? `🎯 目標: ${game.maxTurns}ターン逃げ切れ！`
                        : "🎯 目標: 泥棒を見つけて逮捕せよ！"}
                </p>
            </div>
        </div>
    );
}
