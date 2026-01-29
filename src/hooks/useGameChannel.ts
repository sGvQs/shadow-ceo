'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface GameChannelOptions {
    gameId: string;
    playerId: string;
    onBoardUpdate?: (data: unknown) => void;
    onPlayerAction?: (action: { playerId: string; action: string; data: unknown }) => void;
    onGameEnd?: () => void;
}

export function useGameChannel({
    gameId,
    playerId,
    onBoardUpdate,
    onPlayerAction,
    onGameEnd,
}: GameChannelOptions) {
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // チャンネル接続
    useEffect(() => {
        const gameChannel = supabase.channel(`game:${gameId}`, {
            config: {
                presence: {
                    key: playerId,
                },
            },
        });

        // 盤面更新を購読
        gameChannel.on('broadcast', { event: 'board_update' }, ({ payload }) => {
            onBoardUpdate?.(payload);
        });

        // プレイヤーアクションを購読
        gameChannel.on('broadcast', { event: 'player_action' }, ({ payload }) => {
            onPlayerAction?.(payload as { playerId: string; action: string; data: unknown });
        });

        // ゲーム終了を購読
        gameChannel.on('broadcast', { event: 'game_end' }, () => {
            onGameEnd?.();
        });

        // プレゼンス
        gameChannel.on('presence', { event: 'sync' }, () => {
            const state = gameChannel.presenceState();
            console.log('Presence state:', state);
        });

        gameChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                setIsConnected(true);
                // プレゼンスをトラック
                gameChannel.track({
                    playerId,
                    joinedAt: new Date().toISOString(),
                });
            }
        });

        setChannel(gameChannel);

        return () => {
            gameChannel.unsubscribe();
        };
    }, [gameId, playerId, onBoardUpdate, onPlayerAction, onGameEnd]);

    // アクションをブロードキャスト
    const broadcastAction = useCallback(
        async (action: string, data: unknown) => {
            if (!channel || !isConnected) return;

            await channel.send({
                type: 'broadcast',
                event: 'player_action',
                payload: { playerId, action, data },
            });
        },
        [channel, isConnected, playerId]
    );

    // 盤面更新をブロードキャスト
    const broadcastBoardUpdate = useCallback(
        async (boardData: unknown) => {
            if (!channel || !isConnected) return;

            await channel.send({
                type: 'broadcast',
                event: 'board_update',
                payload: boardData,
            });
        },
        [channel, isConnected]
    );

    // ゲーム終了をブロードキャスト
    const broadcastGameEnd = useCallback(async () => {
        if (!channel || !isConnected) return;

        await channel.send({
            type: 'broadcast',
            event: 'game_end',
            payload: {},
        });
    }, [channel, isConnected]);

    return {
        isConnected,
        broadcastAction,
        broadcastBoardUpdate,
        broadcastGameEnd,
    };
}
