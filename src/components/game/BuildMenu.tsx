'use client';

import { useState } from 'react';
import type { ResourceState } from '@/types/game';
import { BUILD_COSTS, BUILD_BP } from '@/types/game';
import { canBuild } from '@/lib/game/resources';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BuildMenuProps {
    resources: ResourceState;
    onBuild: (type: 'road' | 'startup' | 'devCard') => void;
    disabled?: boolean;
}

const BUILD_INFO = {
    road: {
        name: '道（ロジスティクス）',
        icon: '🛤️',
        description: 'ネットワーク拡張',
        cost: 'コンクリート1 + 木材1',
        bp: 0,
    },
    startup: {
        name: 'オフィス小（スタートアップ）',
        icon: '🏢',
        description: '資源産出1',
        cost: '木材1 + 食料1',
        bp: 1,
    },
    devCard: {
        name: '指示カード',
        icon: '📋',
        description: '特殊効果を購入',
        cost: '金1 + 石油1 + レアメタル1',
        bp: 0,
    },
};

export function BuildMenu({ resources, onBuild, disabled = false }: BuildMenuProps) {
    const [selectedBuild, setSelectedBuild] = useState<'road' | 'startup' | 'devCard' | null>(null);

    const buildOptions = [
        { type: 'road' as const, canAfford: canBuild(resources, 'road') },
        { type: 'startup' as const, canAfford: canBuild(resources, 'startup') },
        { type: 'devCard' as const, canAfford: canBuild(resources, 'devCard') },
    ];

    function handleBuild(type: 'road' | 'startup' | 'devCard') {
        onBuild(type);
        setSelectedBuild(null);
    }

    return (
        <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">建設</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {buildOptions.map(({ type, canAfford }) => {
                    const info = BUILD_INFO[type];
                    return (
                        <button
                            key={type}
                            onClick={() => setSelectedBuild(selectedBuild === type ? null : type)}
                            disabled={disabled || !canAfford}
                            className={`w-full p-3 rounded-lg text-left transition-all ${canAfford
                                    ? selectedBuild === type
                                        ? 'bg-amber-500/30 border border-amber-500'
                                        : 'bg-slate-700/50 hover:bg-slate-600/50'
                                    : 'bg-slate-800/50 opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{info.icon}</span>
                                <div className="flex-1">
                                    <div className="font-medium">{info.name}</div>
                                    <div className="text-xs text-slate-400">{info.cost}</div>
                                </div>
                                {info.bp > 0 && (
                                    <div className="text-amber-400 font-bold">+{info.bp} BP</div>
                                )}
                            </div>
                        </button>
                    );
                })}

                {selectedBuild && (
                    <div className="pt-2 border-t border-slate-700">
                        <p className="text-sm text-slate-400 mb-2">
                            {BUILD_INFO[selectedBuild].description}
                        </p>
                        <Button
                            onClick={() => handleBuild(selectedBuild)}
                            disabled={disabled}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                        >
                            建設を確定
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
