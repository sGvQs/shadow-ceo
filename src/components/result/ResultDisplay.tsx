'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { RandomBonusType } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlayerResult {
    id: string;
    displayName: string;
    color: string;
    businessPoints: number;
    finalMoney: number;
    rank: number;
    isWinner: boolean;
    isCurrentPlayer: boolean;
    receivedFrom: { investorName: string; investorColor: string; percentage: number }[];
    investedTo: { targetName: string; targetColor: string; percentage: number }[];
}

interface ResultDisplayProps {
    players: PlayerResult[];
    bonusType: RandomBonusType | null;
    bonusInfo: { name: string; bp: number } | null;
    winnerName: string;
    winnerColor: string;
}

const ROULETTE_ITEMS = [
    { type: 'SHORTEST_ROAD_BONUS', emoji: '🛤️', name: '道が最短の人' },
    { type: 'MOST_RESOURCE_BONUS', emoji: '📦', name: '資源最多保持者' },
    { type: 'LEAST_MONEY_BONUS', emoji: '💸', name: '金最少保持者' },
    { type: 'MOST_OFFICES_BONUS', emoji: '🏢', name: 'オフィス最多' },
    { type: 'RANDOM_PLAYER_BONUS', emoji: '🎲', name: 'ランダム1人' },
];

export function ResultDisplay({
    players,
    bonusType,
    bonusInfo,
    winnerName,
    winnerColor,
}: ResultDisplayProps) {
    const [showRoulette, setShowRoulette] = useState(true);
    const [rouletteIndex, setRouletteIndex] = useState(0);
    const [rouletteComplete, setRouletteComplete] = useState(false);
    const [showInvestments, setShowInvestments] = useState(false);

    // ルーレットアニメーション
    useEffect(() => {
        if (!showRoulette || rouletteComplete) return;

        const targetIndex = ROULETTE_ITEMS.findIndex(item => item.type === bonusType);
        let currentSpeed = 50;
        let currentIndex = 0;
        let iterations = 0;
        const maxIterations = 20 + targetIndex;

        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % ROULETTE_ITEMS.length;
            setRouletteIndex(currentIndex);
            iterations++;

            if (iterations >= maxIterations) {
                clearInterval(interval);
                setRouletteComplete(true);
                setTimeout(() => {
                    setShowRoulette(false);
                    setShowInvestments(true);
                }, 2000);
            }
        }, currentSpeed + iterations * 10);

        return () => clearInterval(interval);
    }, [showRoulette, bonusType, rouletteComplete]);

    if (showRoulette) {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="py-16">
                        <h2 className="text-2xl font-bold mb-8">🎰 ランダムボーナス抽選中...</h2>

                        <div className="relative h-24 overflow-hidden rounded-lg bg-slate-900 mb-8">
                            <div
                                className="absolute inset-0 flex items-center justify-center transition-transform duration-100"
                                style={{
                                    transform: `translateY(${-rouletteIndex * 96}px)`,
                                }}
                            >
                                {ROULETTE_ITEMS.map((item, index) => (
                                    <div
                                        key={item.type}
                                        className={`absolute w-full h-24 flex items-center justify-center text-2xl gap-4 ${rouletteComplete && item.type === bonusType
                                                ? 'bg-amber-500/20 border-2 border-amber-500'
                                                : ''
                                            }`}
                                        style={{ top: `${index * 96}px` }}
                                    >
                                        <span className="text-4xl">{item.emoji}</span>
                                        <span className="font-bold">{item.name}</span>
                                        {bonusInfo && item.type === bonusType && rouletteComplete && (
                                            <Badge className="bg-amber-500 text-black">+{bonusInfo.bp} BP</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {rouletteComplete && (
                            <div className="animate-pulse text-amber-400 text-xl">
                                ✨ {bonusInfo?.name} に +{bonusInfo?.bp} BP！
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* 勝者発表 */}
            <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500">
                <CardContent className="py-8 text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-3xl font-bold mb-2">勝者</h2>
                    <div className="flex items-center justify-center gap-3">
                        <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: winnerColor }}
                        />
                        <span className="text-4xl font-bold text-amber-400">{winnerName}</span>
                    </div>
                    <div className="text-xl text-slate-400 mt-2">
                        💰 最終獲得マネー: {players[0]?.finalMoney.toFixed(2)}
                    </div>
                </CardContent>
            </Card>

            {/* ボーナス情報 */}
            {bonusInfo && (
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="py-4 text-center">
                        <span className="text-amber-400">🎰 ランダムボーナス: {bonusInfo.name} (+{bonusInfo.bp} BP)</span>
                    </CardContent>
                </Card>
            )}

            {/* ランキング */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                    <CardTitle>最終結果</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {players.map((player) => (
                        <div
                            key={player.id}
                            className={`p-4 rounded-lg ${player.isWinner
                                    ? 'bg-amber-500/20 border border-amber-500'
                                    : 'bg-slate-700/30'
                                } ${player.isCurrentPlayer ? 'ring-2 ring-white/30' : ''}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold text-slate-500">#{player.rank}</span>
                                    <div
                                        className="w-6 h-6 rounded-full"
                                        style={{ backgroundColor: player.color }}
                                    />
                                    <span className="font-medium text-lg">{player.displayName}</span>
                                    {player.isWinner && <span className="text-xl">👑</span>}
                                    {player.isCurrentPlayer && <Badge variant="secondary">あなた</Badge>}
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-amber-400">
                                        💰 {player.finalMoney.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-slate-400">{player.businessPoints} BP</div>
                                </div>
                            </div>

                            {/* 投資情報（開示） */}
                            {showInvestments && (
                                <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-600">
                                    {/* 投資した先 */}
                                    <div>
                                        <div className="text-xs text-slate-500 mb-2">投資先</div>
                                        <div className="space-y-1">
                                            {player.investedTo.filter(inv => inv.percentage > 0).map((inv, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: inv.targetColor }}
                                                    />
                                                    <span>{inv.targetName}</span>
                                                    <span className="text-amber-400">{inv.percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 投資された人 */}
                                    <div>
                                        <div className="text-xs text-slate-500 mb-2">投資元</div>
                                        <div className="space-y-1">
                                            {player.receivedFrom.map((inv, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: inv.investorColor }}
                                                    />
                                                    <span>{inv.investorName}</span>
                                                    <span className="text-green-400">→ {inv.percentage}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* アクションボタン */}
            <div className="flex justify-center gap-4">
                <Link href="/lobby">
                    <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600">
                        ロビーに戻る
                    </Button>
                </Link>
            </div>
        </div>
    );
}
