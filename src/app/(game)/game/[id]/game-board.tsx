"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
    gameId: string;
    thiefPos: number | null;
    copPos: number[];
    footprints: { pos: number; turn: number }[];
    isThief: boolean;
    status: string;
};

// 隣接マスを計算する関数
function getAdjacentCells(pos: number): number[] {
    const row = Math.floor(pos / 3);
    const col = pos % 3;
    const adjacent: number[] = [];

    // 上
    if (row > 0) adjacent.push(pos - 3);
    // 下
    if (row < 2) adjacent.push(pos + 3);
    // 左
    if (col > 0) adjacent.push(pos - 1);
    // 右
    if (col < 2) adjacent.push(pos + 1);

    return adjacent;
}

export function GameBoard({
    gameId,
    thiefPos: initialThiefPos,
    copPos: initialCopPos,
    footprints: initialFootprints,
    isThief,
    status,
}: Props) {
    const [thiefPos, setThiefPos] = useState(initialThiefPos);
    const [copPos, setCopPos] = useState(initialCopPos);
    const [footprints, setFootprints] = useState(initialFootprints);
    const [selectedCell, setSelectedCell] = useState<number | null>(null);

    // Supabase Realtime購読
    useEffect(() => {
        const channel = supabase
            .channel(`game:${gameId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "Group",
                    filter: `id=eq.${gameId}`,
                },
                (payload) => {
                    const newData = payload.new as {
                        thiefPos: number;
                        copPos: number[];
                        footprints: { pos: number; turn: number }[];
                        status: string;
                    };

                    // 泥棒の位置は自分が泥棒の場合のみ更新
                    if (isThief) {
                        setThiefPos(newData.thiefPos);
                    }
                    setCopPos(newData.copPos);
                    setFootprints(newData.footprints || []);

                    // ゲーム終了時はリロード
                    if (newData.status === "FINISHED") {
                        window.location.reload();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [gameId, isThief]);

    const handleCellClick = useCallback((cellIndex: number) => {
        setSelectedCell((prev) => (prev === cellIndex ? null : cellIndex));
    }, []);

    // 各セルのレンダリング
    const renderCell = (index: number) => {
        const hasCop = copPos.includes(index);
        const hasThief = isThief && thiefPos === index;
        const hasFootprint = footprints.some((f) => f.pos === index);
        const isSelected = selectedCell === index;

        // 泥棒の場合：警察のいる位置も見える
        // 警察の場合：警察の位置のみ見える（泥棒は見えない）

        const isAdjacent =
            (isThief && thiefPos !== null && getAdjacentCells(thiefPos).includes(index)) ||
            (!isThief && copPos.some((cp) => getAdjacentCells(cp).includes(index)));

        return (
            <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={status !== "PLAYING"}
                className={`
          grid-cell aspect-square relative
          ${isSelected ? "ring-2 ring-[var(--color-ink)] ring-offset-2" : ""}
          ${isAdjacent && !hasThief && !hasCop ? "bg-[var(--color-paper-dark)]" : ""}
          ${status !== "PLAYING" ? "cursor-default" : ""}
        `}
            >
                {/* Thief marker */}
                {hasThief && (
                    <span className="text-3xl animate-pulse">🎭</span>
                )}

                {/* Cop marker */}
                {hasCop && (
                    <span className="text-3xl">🚔</span>
                )}

                {/* Footprint indicator (only visible after inspection) */}
                {hasFootprint && !hasThief && !hasCop && (
                    <span className="absolute bottom-1 right-1 text-sm opacity-60">
                        👣
                    </span>
                )}

                {/* Cell number (for debugging / reference) */}
                <span className="absolute top-1 left-1 text-xs text-ink-faint opacity-50">
                    {index}
                </span>
            </button>
        );
    };

    return (
        <div className="paper-card p-4">
            <div className="game-grid">
                {Array.from({ length: 9 }, (_, i) => renderCell(i))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex justify-center gap-6 text-sm text-ink-light">
                {isThief ? (
                    <>
                        <span>🎭 あなた</span>
                        <span>🚔 警察</span>
                    </>
                ) : (
                    <>
                        <span>🚔 あなた</span>
                        <span>🎭 ???</span>
                    </>
                )}
            </div>

            {/* Selected cell indicator */}
            {selectedCell !== null && status === "PLAYING" && (
                <div className="mt-4 text-center text-ink-faint text-sm">
                    セル {selectedCell} を選択中
                </div>
            )}
        </div>
    );
}
