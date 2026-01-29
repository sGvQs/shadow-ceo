'use client';

import { useState } from 'react';
import type { BoardState, ResourceState, DevCard, ResourceType } from '@/types/game';
import { HexBoard } from './HexBoard';
import { ResourcePanel } from './ResourcePanel';
import { Dice } from './Dice';
import { BuildMenu } from './BuildMenu';
import { DevCardPanel } from './DevCardPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { performDiceRoll, performExchangeGold, performBuild, endTurn, moveCop } from '@/actions/game';
import { useDevCard } from '@/actions/devCards';

interface Player {
    id: string;
    displayName: string;
    color: string;
    businessPoints: number;
    isCurrentPlayer: boolean;
}

interface GameLog {
    id: string;
    action: string;
    data: Record<string, unknown>;
    playerId: string | null;
    createdAt: Date;
}

interface GameBoardProps {
    gameId: string;
    boardState: BoardState;
    players: Player[];
    myResources: ResourceState;
    isMyTurn: boolean;
    gameLog: GameLog[];
}

export function GameBoard({
    gameId,
    boardState,
    players,
    myResources,
    isMyTurn,
    gameLog,
}: GameBoardProps) {
    const [lastDiceRoll, setLastDiceRoll] = useState<{ dice1: number; dice2: number } | undefined>();
    const [hasRolled, setHasRolled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTileId, setSelectedTileId] = useState<string | undefined>();
    const [showCopMove, setShowCopMove] = useState(false);

    async function handleDiceRoll() {
        if (!isMyTurn || hasRolled) return;
        setIsLoading(true);
        try {
            const result = await performDiceRoll(gameId);
            setLastDiceRoll({ dice1: result.dice1, dice2: result.dice2 });
            setHasRolled(true);

            // 7の目なら警官移動モードへ
            if (result.sum === 7) {
                setShowCopMove(true);
            }
        } catch (error) {
            console.error('Dice roll failed:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleExchangeGold(targetResource: string) {
        if (!isMyTurn) return;
        setIsLoading(true);
        try {
            await performExchangeGold(gameId, targetResource as 'food' | 'concrete' | 'wood' | 'oil' | 'rareMetal');
        } catch (error) {
            console.error('Exchange failed:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleBuild(type: 'road' | 'startup' | 'devCard') {
        if (!isMyTurn || !hasRolled) return;
        setIsLoading(true);
        try {
            // 簡略化: 盤面のランダム位置に建設
            const position = type !== 'devCard' ? {
                hexId: boardState.tiles[Math.floor(Math.random() * boardState.tiles.length)].id,
                direction: Math.floor(Math.random() * 6),
            } : undefined;

            await performBuild(gameId, type, position);
        } catch (error) {
            console.error('Build failed:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleEndTurn() {
        if (!isMyTurn || !hasRolled) return;
        setIsLoading(true);
        try {
            await endTurn(gameId);
            setHasRolled(false);
            setLastDiceRoll(undefined);
            setShowCopMove(false);
        } catch (error) {
            console.error('End turn failed:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCopMove(tileId: string, isBribe: boolean) {
        setIsLoading(true);
        try {
            await moveCop(gameId, tileId, isBribe);
            setShowCopMove(false);
            setSelectedTileId(undefined);
        } catch (error) {
            console.error('Cop move failed:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // アクション名を日本語に変換
    function getActionLabel(action: string): string {
        const labels: Record<string, string> = {
            DICE_ROLL: '🎲 ダイスロール',
            BUILD_ROAD: '🛤️ 道を建設',
            BUILD_STARTUP: '🏢 オフィス建設',
            BUILD_DEVCARD: '📋 指示カード購入',
            EXCHANGE_GOLD: '💱 金を交換',
            COP_MOVE: '👮 警官移動',
            END_TURN: '⏭️ ターン終了',
            TAX_COLLECTED: '💸 税金徴収',
        };
        return labels[action] || action;
    }

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
            {/* メインボード */}
            <div className="bg-slate-800/30 rounded-xl p-4 overflow-auto">
                <HexBoard
                    boardState={boardState}
                    players={players}
                    onTileClick={showCopMove ? setSelectedTileId : undefined}
                    selectedTileId={selectedTileId}
                />

                {/* 警官移動UI */}
                {showCopMove && selectedTileId && (
                    <div className="mt-4 p-4 bg-red-900/30 rounded-lg border border-red-500 text-center">
                        <p className="mb-3">👮 警官を移動してください</p>
                        <div className="flex gap-2 justify-center">
                            <Button
                                onClick={() => handleCopMove(selectedTileId, false)}
                                variant="destructive"
                                disabled={isLoading}
                            >
                                移動する
                            </Button>
                            <Button
                                onClick={() => setSelectedTileId(undefined)}
                                variant="outline"
                            >
                                キャンセル
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* サイドパネル */}
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                {/* ダイス */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="py-4">
                        <Dice
                            onRoll={handleDiceRoll}
                            lastRoll={lastDiceRoll}
                            disabled={!isMyTurn || hasRolled || isLoading}
                        />
                    </CardContent>
                </Card>

                {/* リソース */}
                <ResourcePanel
                    resources={myResources}
                    onExchangeGold={handleExchangeGold}
                    canExchange={isMyTurn}
                />

                {/* 建設メニュー */}
                <BuildMenu
                    resources={myResources}
                    onBuild={handleBuild}
                    disabled={!isMyTurn || !hasRolled || isLoading}
                />

                {/* ターン終了 */}
                {isMyTurn && hasRolled && !showCopMove && (
                    <Button
                        onClick={handleEndTurn}
                        disabled={isLoading}
                        className="w-full bg-slate-600 hover:bg-slate-500"
                    >
                        ターンを終了
                    </Button>
                )}

                {/* 買収ボタン */}
                {isMyTurn && myResources.gold >= 3 && !showCopMove && (
                    <Button
                        onClick={() => setShowCopMove(true)}
                        variant="outline"
                        className="w-full text-amber-400 border-amber-400/50"
                    >
                        👮 買収（金3枚で警官移動）
                    </Button>
                )}

                {/* ゲームログ */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">ゲームログ</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-40 overflow-y-auto space-y-1">
                        {gameLog.map((log) => {
                            const player = players.find(p => p.id === log.playerId);
                            return (
                                <div key={log.id} className="text-xs text-slate-400 flex items-center gap-2">
                                    {player && (
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: player.color }}
                                        />
                                    )}
                                    <span>{getActionLabel(log.action)}</span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
