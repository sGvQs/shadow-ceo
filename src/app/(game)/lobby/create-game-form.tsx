"use client";

import { useState, useTransition } from "react";
import { createGameAction } from "@/actions/game";
import { useRouter } from "next/navigation";

export function CreateGameForm() {
    const [selectedRole, setSelectedRole] = useState<"THIEF" | "COP" | null>(
        null
    );
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleCreate = () => {
        if (!selectedRole) return;

        startTransition(async () => {
            try {
                const game = await createGameAction(selectedRole);
                // 作成したゲームのページへ（またはロビーで待機）
                router.refresh();
            } catch (error) {
                console.error("ゲーム作成エラー:", error);
                alert(
                    error instanceof Error ? error.message : "ゲームの作成に失敗しました"
                );
            }
        });
    };

    return (
        <div className="paper-card">
            <p className="text-ink-light mb-4">プレイする役を選択してください</p>

            <div className="flex gap-4 mb-6">
                <button
                    type="button"
                    onClick={() => setSelectedRole("THIEF")}
                    className={`flex-1 p-6 rounded-lg border-2 transition-all ${selectedRole === "THIEF"
                            ? "border-[var(--color-thief)] bg-[rgba(224,122,95,0.1)]"
                            : "border-[var(--color-ink-faint)] hover:border-[var(--color-thief)]"
                        }`}
                >
                    <div className="text-4xl mb-2">🎭</div>
                    <div className="font-notebook text-xl text-thief">泥棒</div>
                    <p className="text-ink-faint text-sm mt-2">
                        15ターン逃げ切れば勝利
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => setSelectedRole("COP")}
                    className={`flex-1 p-6 rounded-lg border-2 transition-all ${selectedRole === "COP"
                            ? "border-[var(--color-cop)] bg-[rgba(61,90,128,0.1)]"
                            : "border-[var(--color-ink-faint)] hover:border-[var(--color-cop)]"
                        }`}
                >
                    <div className="text-4xl mb-2">🚔</div>
                    <div className="font-notebook text-xl text-cop">警察</div>
                    <p className="text-ink-faint text-sm mt-2">
                        泥棒を逮捕すれば勝利
                    </p>
                </button>
            </div>

            <button
                type="button"
                onClick={handleCreate}
                disabled={!selectedRole || isPending}
                className={`btn w-full ${!selectedRole || isPending ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {isPending ? (
                    <span className="loading-pencil">✏️ 作成中...</span>
                ) : (
                    "🎮 ゲームを作成"
                )}
            </button>
        </div>
    );
}
