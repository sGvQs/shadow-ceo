'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { submitInvestments } from '@/actions/invest';

interface Player {
    id: string;
    displayName: string;
    color: string;
    isCurrentPlayer: boolean;
    isReady: boolean;
}

interface InvestmentFormProps {
    gameId: string;
    players: Player[];
    initialInvestments: Record<string, number>;
    isReady: boolean;
}

export function InvestmentForm({
    gameId,
    players,
    initialInvestments,
    isReady,
}: InvestmentFormProps) {
    const [investments, setInvestments] = useState<Record<string, number>>(() => {
        // 初期値を設定（既存がなければ均等分配）
        if (Object.keys(initialInvestments).length > 0) {
            return initialInvestments;
        }
        const equal = Math.floor(100 / players.length);
        const remainder = 100 - equal * players.length;
        return players.reduce((acc, p, idx) => {
            acc[p.id] = equal + (idx === 0 ? remainder : 0);
            return acc;
        }, {} as Record<string, number>);
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const total = useMemo(() => {
        return Object.values(investments).reduce((sum, v) => sum + v, 0);
    }, [investments]);

    const isValid = total === 100;

    function handleSliderChange(playerId: string, value: number[]) {
        setInvestments(prev => ({
            ...prev,
            [playerId]: value[0],
        }));
    }

    async function handleSubmit() {
        if (!isValid) return;

        setIsLoading(true);
        setError('');

        try {
            const investmentList = Object.entries(investments).map(([targetPlayerId, percentage]) => ({
                targetPlayerId,
                percentage,
            }));

            const result = await submitInvestments(gameId, investmentList);
            if (result?.error) {
                setError(result.error);
            }
        } catch (err) {
            setError('投資の確定に失敗しました');
        } finally {
            setIsLoading(false);
        }
    }

    if (isReady) {
        return (
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold mb-2">投資を確定しました</h3>
                    <p className="text-slate-400">
                        他のプレイヤーが投資を完了するまでお待ちください
                    </p>
                    <div className="mt-8">
                        <h4 className="text-sm text-slate-500 mb-4">待機中のプレイヤー:</h4>
                        <div className="flex justify-center gap-2 flex-wrap">
                            {players.map(p => (
                                <Badge
                                    key={p.id}
                                    variant={p.isReady ? 'secondary' : 'outline'}
                                    className={p.isReady ? 'bg-green-500/20 text-green-400' : ''}
                                >
                                    {p.isReady ? '✓ ' : ''}{p.displayName}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* 投資配分カード */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>投資配分</span>
                        <span className={`text-lg ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                            合計: {total}%
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {players.map(player => (
                        <div key={player.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: player.color }}
                                    />
                                    <span className="font-medium">
                                        {player.displayName}
                                        {player.isCurrentPlayer && (
                                            <span className="text-amber-400 ml-2">(あなた)</span>
                                        )}
                                    </span>
                                </div>
                                <span className="font-mono text-lg font-bold text-amber-400">
                                    {investments[player.id] ?? 0}%
                                </span>
                            </div>
                            <Slider
                                value={[investments[player.id] ?? 0]}
                                onValueChange={(value) => handleSliderChange(player.id, value)}
                                max={100}
                                step={5}
                                className="cursor-pointer"
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* 円グラフ風ビジュアル */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-6">
                    <div className="flex justify-center gap-4 flex-wrap">
                        {players.map(player => {
                            const percentage = investments[player.id] ?? 0;
                            return (
                                <div key={player.id} className="text-center">
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold mb-2"
                                        style={{
                                            backgroundColor: player.color,
                                            opacity: percentage > 0 ? 0.3 + (percentage / 100) * 0.7 : 0.2,
                                        }}
                                    >
                                        {percentage}%
                                    </div>
                                    <div className="text-sm text-slate-400 truncate max-w-[80px]">
                                        {player.displayName}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* エラー表示 */}
            {error && (
                <p className="text-red-400 text-center">{error}</p>
            )}

            {/* 確定ボタン */}
            <Button
                onClick={handleSubmit}
                disabled={!isValid || isLoading}
                className="w-full py-6 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
                {isLoading ? '確定中...' : '投資を確定する'}
            </Button>

            {!isValid && (
                <p className="text-center text-slate-500 text-sm">
                    投資の合計が100%になるように調整してください
                </p>
            )}
        </div>
    );
}
