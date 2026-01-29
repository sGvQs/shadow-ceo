"use client";

import { useState, useTransition } from "react";
import {
    thiefMoveAction,
    copMoveAction,
    copInspectAction,
    copArrestAction,
} from "@/actions/game-actions";

type Player = {
    id: string;
    role: string;
    userId: string;
};

type Game = {
    id: string;
    status: string;
    turnCount: number;
    thiefPos: number;
    copPos: number[];
};

type Props = {
    gameId: string;
    currentPlayer: Player;
    game: Game;
    isThief: boolean;
};

export function ActionPanel({ gameId, currentPlayer, game, isThief }: Props) {
    const [isPending, startTransition] = useTransition();
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [targetCell, setTargetCell] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const isPlaying = game.status === "PLAYING";

    const handleThiefMove = (direction: "up" | "down" | "left" | "right" | "stay") => {
        startTransition(async () => {
            try {
                const result = await thiefMoveAction(gameId, direction);
                if (result.success) {
                    setMessage(result.message || "移動しました");
                } else {
                    setMessage(result.error || "移動できませんでした");
                }
            } catch (error) {
                setMessage("エラーが発生しました");
            }
        });
    };

    const handleCopMove = (direction: "up" | "down" | "left" | "right") => {
        startTransition(async () => {
            try {
                const result = await copMoveAction(gameId, direction);
                if (result.success) {
                    setMessage(result.message || "移動しました");
                } else {
                    setMessage(result.error || "移動できませんでした");
                }
            } catch (error) {
                setMessage("エラーが発生しました");
            }
        });
    };

    const handleInspect = () => {
        startTransition(async () => {
            try {
                const result = await copInspectAction(gameId);
                if (result.success) {
                    setMessage(result.message || "捜索しました");
                } else {
                    setMessage(result.error || "捜索できませんでした");
                }
            } catch (error) {
                setMessage("エラーが発生しました");
            }
        });
    };

    const handleArrest = (targetPos: number) => {
        startTransition(async () => {
            try {
                const result = await copArrestAction(gameId, targetPos);
                if (result.success) {
                    setMessage(result.message || "逮捕を試みました");
                    if (result.arrested) {
                        setMessage("🎉 泥棒を逮捕しました！");
                    }
                } else {
                    setMessage(result.error || "逮捕できませんでした");
                }
            } catch (error) {
                setMessage("エラーが発生しました");
            }
        });
    };

    if (game.status === "WAITING") {
        return (
            <div className="paper-card">
                <h3 className="font-notebook text-xl text-center mb-4">
                    ⏳ 対戦相手を待機中...
                </h3>
                <p className="text-ink-faint text-sm text-center">
                    もう一人のプレイヤーが参加するまでお待ちください
                </p>
            </div>
        );
    }

    if (game.status === "FINISHED") {
        return (
            <div className="paper-card">
                <h3 className="font-notebook text-xl text-center mb-4">
                    🏆 ゲーム終了
                </h3>
                <p className="text-ink-light text-center">
                    お疲れさまでした！
                </p>
            </div>
        );
    }

    return (
        <div className="paper-card">
            <h3 className="font-notebook text-xl mb-4">
                {isThief ? "🎭 泥棒のアクション" : "🚔 警察のアクション"}
            </h3>

            {/* Message */}
            {message && (
                <div className="mb-4 p-3 bg-[var(--color-paper-dark)] rounded-lg text-sm text-ink-light">
                    {message}
                </div>
            )}

            {isThief ? (
                /* Thief Actions */
                <div className="space-y-4">
                    <p className="text-sm text-ink-faint">移動先を選択:</p>

                    {/* Direction buttons */}
                    <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
                        <div />
                        <button
                            onClick={() => handleThiefMove("up")}
                            disabled={isPending || !isPlaying}
                            className="btn text-sm py-2"
                        >
                            ↑
                        </button>
                        <div />

                        <button
                            onClick={() => handleThiefMove("left")}
                            disabled={isPending || !isPlaying}
                            className="btn text-sm py-2"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => handleThiefMove("stay")}
                            disabled={isPending || !isPlaying}
                            className="btn btn-outline text-sm py-2"
                        >
                            ●
                        </button>
                        <button
                            onClick={() => handleThiefMove("right")}
                            disabled={isPending || !isPlaying}
                            className="btn text-sm py-2"
                        >
                            →
                        </button>

                        <div />
                        <button
                            onClick={() => handleThiefMove("down")}
                            disabled={isPending || !isPlaying}
                            className="btn text-sm py-2"
                        >
                            ↓
                        </button>
                        <div />
                    </div>

                    <p className="text-xs text-ink-faint text-center">
                        ● = その場に留まる
                    </p>
                </div>
            ) : (
                /* Cop Actions */
                <div className="space-y-4">
                    <p className="text-sm text-ink-faint">移動先を選択:</p>

                    {/* Direction buttons */}
                    <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
                        <div />
                        <button
                            onClick={() => handleCopMove("up")}
                            disabled={isPending || !isPlaying}
                            className="btn text-sm py-2"
                        >
                            ↑
                        </button>
                        <div />

                        <button
                            onClick={() => handleCopMove("left")}
                            disabled={isPending || !isPlaying}
                            className="btn text-sm py-2"
                        >
                            ←
                        </button>
                        <div />
                        <button
                            onClick={() => handleCopMove("right")}
                            disabled={isPending || !isPlaying}
                            className="btn text-sm py-2"
                        >
                            →
                        </button>

                        <div />
                        <button
                            onClick={() => handleCopMove("down")}
                            disabled={isPending || !isPlaying}
                            className="btn text-sm py-2"
                        >
                            ↓
                        </button>
                        <div />
                    </div>

                    {/* Special Actions */}
                    <div className="pt-4 border-t-2 border-dashed border-[var(--color-grid)]">
                        <p className="text-sm text-ink-faint mb-3">特殊アクション:</p>

                        <div className="space-y-2">
                            <button
                                onClick={handleInspect}
                                disabled={isPending || !isPlaying}
                                className="btn btn-cop w-full text-sm"
                            >
                                🔍 検査 (現在地を調べる)
                            </button>

                            <div>
                                <p className="text-xs text-ink-faint mb-2">
                                    逮捕するマスを選択:
                                </p>
                                <div className="grid grid-cols-3 gap-1">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                                        <button
                                            key={pos}
                                            onClick={() => handleArrest(pos)}
                                            disabled={isPending || !isPlaying}
                                            className="btn btn-thief text-xs py-1"
                                        >
                                            {pos}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isPending && (
                <div className="mt-4 text-center text-ink-faint">
                    <span className="loading-pencil">✏️</span> 処理中...
                </div>
            )}
        </div>
    );
}
