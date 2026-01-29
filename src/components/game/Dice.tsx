'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DiceProps {
    onRoll: () => void;
    lastRoll?: { dice1: number; dice2: number };
    disabled?: boolean;
}

export function Dice({ onRoll, lastRoll, disabled = false }: DiceProps) {
    const [isRolling, setIsRolling] = useState(false);

    async function handleRoll() {
        if (isRolling || disabled) return;
        setIsRolling(true);

        // アニメーション待機
        await new Promise(resolve => setTimeout(resolve, 800));
        onRoll();
        setIsRolling(false);
    }

    // ダイスの目を表示
    function renderDiceFace(value: number) {
        const dotPositions: Record<number, { x: number; y: number }[]> = {
            1: [{ x: 20, y: 20 }],
            2: [{ x: 10, y: 10 }, { x: 30, y: 30 }],
            3: [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 30 }],
            4: [{ x: 10, y: 10 }, { x: 30, y: 10 }, { x: 10, y: 30 }, { x: 30, y: 30 }],
            5: [{ x: 10, y: 10 }, { x: 30, y: 10 }, { x: 20, y: 20 }, { x: 10, y: 30 }, { x: 30, y: 30 }],
            6: [{ x: 10, y: 10 }, { x: 30, y: 10 }, { x: 10, y: 20 }, { x: 30, y: 20 }, { x: 10, y: 30 }, { x: 30, y: 30 }],
        };

        const dots = dotPositions[value] || [];

        return (
            <svg width="40" height="40" viewBox="0 0 40 40" className="inline-block">
                <rect x="0" y="0" width="40" height="40" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
                {dots.map((dot, i) => (
                    <circle key={i} cx={dot.x} cy={dot.y} r="4" fill="#1e293b" />
                ))}
            </svg>
        );
    }

    return (
        <div className="text-center">
            {lastRoll && (
                <div className="flex justify-center gap-4 mb-4">
                    <div className={`transform ${isRolling ? 'animate-bounce' : ''}`}>
                        {renderDiceFace(lastRoll.dice1)}
                    </div>
                    <div className={`transform ${isRolling ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.1s' }}>
                        {renderDiceFace(lastRoll.dice2)}
                    </div>
                </div>
            )}

            {lastRoll && (
                <div className="text-2xl font-bold mb-4">
                    合計: <span className={lastRoll.dice1 + lastRoll.dice2 === 7 ? 'text-red-400' : 'text-amber-400'}>
                        {lastRoll.dice1 + lastRoll.dice2}
                    </span>
                    {lastRoll.dice1 + lastRoll.dice2 === 7 && (
                        <span className="ml-2 text-red-400">⚠️ 税務署</span>
                    )}
                </div>
            )}

            <Button
                onClick={handleRoll}
                disabled={disabled || isRolling}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
                {isRolling ? '🎲 ロール中...' : '🎲 ダイスを振る'}
            </Button>
        </div>
    );
}
