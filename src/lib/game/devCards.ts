import type { DevCardType, DevCard } from '@/types/game';

// 指示カードデッキを生成
export function generateDevCardDeck(): DevCard[] {
    const deck: DevCard[] = [];

    // カード枚数
    const cardCounts: Record<DevCardType, number> = {
        insider_trading: 5,   // インサイダー取引
        labor_inspection: 3,  // 労基署のガサ入れ
        dx_promotion: 2,      // DX推進
        personnel_change: 4,  // 人事異動
    };

    let id = 0;
    for (const [type, count] of Object.entries(cardCounts)) {
        for (let i = 0; i < count; i++) {
            deck.push({
                id: `devcard-${id++}`,
                type: type as DevCardType,
                isUsed: false,
            });
        }
    }

    // シャッフル
    return shuffle(deck);
}

// 配列をシャッフル
function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
