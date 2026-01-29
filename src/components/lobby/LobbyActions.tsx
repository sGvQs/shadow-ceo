'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { startGame, leaveGame } from '@/actions/lobby';

interface LobbyActionsProps {
    gameId: string;
    isHost: boolean;
    playerCount: number;
}

export function LobbyActions({ gameId, isHost, playerCount }: LobbyActionsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleStart() {
        setIsLoading(true);
        setError('');
        try {
            const result = await startGame(gameId);
            if (result?.error) {
                setError(result.error);
            }
        } catch (err) {
            setError('ゲームの開始に失敗しました');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleLeave() {
        if (!confirm('ロビーを離れますか？')) return;
        setIsLoading(true);
        try {
            await leaveGame(gameId);
        } catch (err) {
            setError('エラーが発生しました');
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            {error && (
                <p className="text-red-400 text-center">{error}</p>
            )}

            <div className="flex gap-4">
                {isHost && (
                    <Button
                        onClick={handleStart}
                        disabled={isLoading || playerCount < 2}
                        className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    >
                        {isLoading ? '開始中...' : 'ゲームを開始'}
                    </Button>
                )}

                <Button
                    onClick={handleLeave}
                    variant="outline"
                    disabled={isLoading}
                    className={isHost ? '' : 'flex-1'}
                >
                    ロビーを離れる
                </Button>
            </div>

            {isHost && playerCount < 2 && (
                <p className="text-center text-slate-500 text-sm">
                    ゲームを開始するには2人以上のプレイヤーが必要です
                </p>
            )}

            {!isHost && (
                <p className="text-center text-slate-500 text-sm">
                    ホストがゲームを開始するのをお待ちください
                </p>
            )}
        </div>
    );
}
