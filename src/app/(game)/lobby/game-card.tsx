"use client";

import { useState, useTransition } from "react";
import { joinGameAction, deleteGameAction } from "@/actions/game";
import { useRouter } from "next/navigation";

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
    createdAt: Date;
    players: Player[];
};

export function GameCard({ game }: { game: Game }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // 既にいる役を確認
    const thiefPlayer = game.players.find((p) => p.role === "THIEF");
    const copPlayer = game.players.find((p) => p.role === "COP");

    const handleJoin = (role: "THIEF" | "COP") => {
        startTransition(async () => {
            try {
                const result = await joinGameAction(game.id, role);
                // ゲームが開始された場合
                if (result?.status === "PLAYING") {
                    router.push(`/game/${game.id}`);
                } else {
                    router.refresh();
                }
            } catch (error) {
                console.error("参加エラー:", error);
                alert(
                    error instanceof Error ? error.message : "ゲームへの参加に失敗しました"
                );
            }
        });
    };

    const handleDelete = () => {
        if (!confirm("このゲームを削除しますか？")) return;

        startTransition(async () => {
            try {
                await deleteGameAction(game.id);
                router.refresh();
            } catch (error) {
                console.error("削除エラー:", error);
                alert(
                    error instanceof Error ? error.message : "ゲームの削除に失敗しました"
                );
            }
        });
    };

    return (
        <div className="paper-card">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-ink-faint text-xs">
                        {new Date(game.createdAt).toLocaleString("ja-JP", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
                <span className="text-sm px-2 py-1 bg-[var(--color-paper-dark)] rounded text-ink-faint">
                    {game.players.length}/2
                </span>
            </div>

            {/* Players */}
            <div className="space-y-2 mb-4">
                {/* Thief slot */}
                <div
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 ${thiefPlayer
                            ? "border-[var(--color-thief)] bg-[rgba(224,122,95,0.05)]"
                            : "border-dashed border-[var(--color-ink-faint)]"
                        }`}
                >
                    <span className="text-2xl">🎭</span>
                    {thiefPlayer ? (
                        <div>
                            <p className="font-medium text-thief">{thiefPlayer.user.name}</p>
                            <p className="text-xs text-ink-faint">泥棒</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => handleJoin("THIEF")}
                            disabled={isPending}
                            className="text-ink-faint hover:text-thief transition-colors"
                        >
                            {isPending ? "参加中..." : "👆 泥棒として参加"}
                        </button>
                    )}
                </div>

                {/* Cop slot */}
                <div
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 ${copPlayer
                            ? "border-[var(--color-cop)] bg-[rgba(61,90,128,0.05)]"
                            : "border-dashed border-[var(--color-ink-faint)]"
                        }`}
                >
                    <span className="text-2xl">🚔</span>
                    {copPlayer ? (
                        <div>
                            <p className="font-medium text-cop">{copPlayer.user.name}</p>
                            <p className="text-xs text-ink-faint">警察</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => handleJoin("COP")}
                            disabled={isPending}
                            className="text-ink-faint hover:text-cop transition-colors"
                        >
                            {isPending ? "参加中..." : "👆 警察として参加"}
                        </button>
                    )}
                </div>
            </div>

            {/* Delete button (only for creator if game is waiting) */}
            {game.players.length === 1 && (
                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-xs text-ink-faint hover:text-[var(--color-thief)] transition-colors"
                >
                    🗑️ ゲームを削除
                </button>
            )}
        </div>
    );
}
