'use client';

import { useState, useMemo } from 'react';
import type { ResourceState, ResourceType } from '@/types/game';
import { RESOURCE_NAMES } from '@/lib/game/resources';
import { Badge } from '@/components/ui/badge';

// 資源アイコン
const RESOURCE_ICONS: Record<ResourceType, string> = {
    food: '🌾',
    gold: '💰',
    concrete: '🧱',
    wood: '🪵',
    oil: '🛢️',
    rareMetal: '💎',
};

interface ResourcePanelProps {
    resources: ResourceState;
    onExchangeGold?: (targetResource: ResourceType) => void;
    canExchange?: boolean;
}

export function ResourcePanel({ resources, onExchangeGold, canExchange = false }: ResourcePanelProps) {
    const [showExchange, setShowExchange] = useState(false);

    const totalResources = useMemo(() => {
        return Object.values(resources).reduce((sum, val) => sum + val, 0);
    }, [resources]);

    const resourceEntries = Object.entries(resources) as [ResourceType, number][];

    return (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-200">リソース</h3>
                <Badge variant="secondary">{totalResources}枚</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {resourceEntries.map(([type, count]) => (
                    <div
                        key={type}
                        className="flex items-center gap-2 p-2 rounded bg-slate-700/50"
                    >
                        <span className="text-xl">{RESOURCE_ICONS[type]}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-400 truncate">{RESOURCE_NAMES[type]}</div>
                            <div className="text-lg font-bold">{count}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 金の交換 */}
            {canExchange && resources.gold >= 2 && (
                <div className="mt-4 border-t border-slate-700 pt-4">
                    <button
                        onClick={() => setShowExchange(!showExchange)}
                        className="w-full text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                        💱 金2枚で資源1枚に交換
                    </button>

                    {showExchange && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {resourceEntries
                                .filter(([type]) => type !== 'gold')
                                .map(([type]) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            onExchangeGold?.(type);
                                            setShowExchange(false);
                                        }}
                                        className="p-2 rounded bg-slate-600 hover:bg-slate-500 transition-colors text-center"
                                    >
                                        <span className="text-xl">{RESOURCE_ICONS[type]}</span>
                                        <div className="text-xs text-slate-300">{RESOURCE_NAMES[type]}</div>
                                    </button>
                                ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
