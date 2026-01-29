'use client';

import { useState } from 'react';
import type { DevCard, DevCardType, ResourceType } from '@/types/game';
import { DEV_CARD_INFO } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DevCardPanelProps {
    devCards: DevCard[];
    onUseCard: (cardId: string, data?: { resource?: ResourceType }) => void;
    disabled?: boolean;
}

const CARD_ICONS: Record<DevCardType, string> = {
    insider_trading: '📈',
    labor_inspection: '👷',
    dx_promotion: '💻',
    personnel_change: '🔄',
};

const RESOURCE_OPTIONS: { type: ResourceType; icon: string; name: string }[] = [
    { type: 'food', icon: '🌾', name: '食料' },
    { type: 'gold', icon: '💰', name: '金' },
    { type: 'concrete', icon: '🧱', name: 'コンクリート' },
    { type: 'wood', icon: '🪵', name: '木材' },
    { type: 'oil', icon: '🛢️', name: '石油' },
    { type: 'rareMetal', icon: '💎', name: 'レアメタル' },
];

export function DevCardPanel({ devCards, onUseCard, disabled = false }: DevCardPanelProps) {
    const [selectedCard, setSelectedCard] = useState<DevCard | null>(null);
    const [showResourcePicker, setShowResourcePicker] = useState(false);

    const unusedCards = devCards.filter(c => !c.isUsed);

    function handleUseCard(card: DevCard) {
        if (card.type === 'insider_trading' || card.type === 'dx_promotion') {
            // リソース選択が必要
            setSelectedCard(card);
            setShowResourcePicker(true);
        } else {
            // 即座に使用
            onUseCard(card.id);
            setSelectedCard(null);
        }
    }

    function handleResourceSelect(resource: ResourceType) {
        if (selectedCard) {
            onUseCard(selectedCard.id, { resource });
            setSelectedCard(null);
            setShowResourcePicker(false);
        }
    }

    if (unusedCards.length === 0) {
        return null;
    }

    return (
        <>
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                        <span>指示カード</span>
                        <span className="text-xs text-slate-400">{unusedCards.length}枚</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {unusedCards.map((card) => {
                        const info = DEV_CARD_INFO[card.type];
                        return (
                            <button
                                key={card.id}
                                onClick={() => handleUseCard(card)}
                                disabled={disabled}
                                className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 hover:border-purple-500/60 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{CARD_ICONS[card.type]}</span>
                                    <div className="flex-1">
                                        <div className="font-medium text-purple-200">{info.name}</div>
                                        <div className="text-xs text-slate-400">{info.description}</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </CardContent>
            </Card>

            {/* リソース選択ダイアログ */}
            <Dialog open={showResourcePicker} onOpenChange={setShowResourcePicker}>
                <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCard && DEV_CARD_INFO[selectedCard.type].name}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCard?.type === 'insider_trading'
                                ? '獲得したい資源を選択してください'
                                : '奪いたい資源を選択してください'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {RESOURCE_OPTIONS.map((resource) => (
                            <Button
                                key={resource.type}
                                onClick={() => handleResourceSelect(resource.type)}
                                variant="outline"
                                className="flex flex-col h-20 gap-1"
                            >
                                <span className="text-2xl">{resource.icon}</span>
                                <span className="text-xs">{resource.name}</span>
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
