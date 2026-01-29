import type { RandomBonusType } from '@/types/game';
import { RANDOM_BONUS_INFO } from '@/types/game';

// ランダムボーナスタイプを選択
export function selectRandomBonus(): RandomBonusType {
    const bonusTypes = Object.keys(RANDOM_BONUS_INFO) as RandomBonusType[];
    const randomIndex = Math.floor(Math.random() * bonusTypes.length);
    return bonusTypes[randomIndex];
}

// プレイヤーの最終マネーを計算
export function calculateFinalMoney(
    investorId: string,
    investments: { investorId: string; targetPlayerId: string; percentage: number }[],
    finalBPs: Record<string, number>
): number {
    return investments
        .filter((inv) => inv.investorId === investorId)
        .reduce((sum, inv) => {
            const targetBP = finalBPs[inv.targetPlayerId] ?? 0;
            return sum + (inv.percentage / 100) * targetBP;
        }, 0);
}

// 全プレイヤーの最終マネーを計算
export function calculateAllFinalMoney(
    playerIds: string[],
    investments: { investorId: string; targetPlayerId: string; percentage: number }[],
    finalBPs: Record<string, number>
): Record<string, number> {
    const result: Record<string, number> = {};

    for (const playerId of playerIds) {
        result[playerId] = calculateFinalMoney(playerId, investments, finalBPs);
    }

    return result;
}

// 勝者を決定
export function determineWinner(
    finalMoney: Record<string, number>
): { winnerId: string; amount: number } | null {
    const entries = Object.entries(finalMoney);
    if (entries.length === 0) return null;

    const [winnerId, amount] = entries.reduce((max, current) =>
        current[1] > max[1] ? current : max
    );

    return { winnerId, amount };
}

// ボーナスを適用する対象プレイヤーを決定
export function determineBonusRecipient(
    bonusType: RandomBonusType,
    playerStats: {
        id: string;
        roadCount: number;
        resourceCount: number;
        goldCount: number;
        officeCount: number;
    }[]
): string | null {
    if (playerStats.length === 0) return null;

    switch (bonusType) {
        case 'SHORTEST_ROAD_BONUS': {
            // 道が最短（最少）の人
            const sorted = [...playerStats].sort((a, b) => a.roadCount - b.roadCount);
            return sorted[0].id;
        }
        case 'MOST_RESOURCE_BONUS': {
            // 資源最多
            const sorted = [...playerStats].sort((a, b) => b.resourceCount - a.resourceCount);
            return sorted[0].id;
        }
        case 'LEAST_MONEY_BONUS': {
            // 金最少
            const sorted = [...playerStats].sort((a, b) => a.goldCount - b.goldCount);
            return sorted[0].id;
        }
        case 'MOST_OFFICES_BONUS': {
            // オフィス最多
            const sorted = [...playerStats].sort((a, b) => b.officeCount - a.officeCount);
            return sorted[0].id;
        }
        case 'RANDOM_PLAYER_BONUS': {
            // ランダム
            const randomIndex = Math.floor(Math.random() * playerStats.length);
            return playerStats[randomIndex].id;
        }
        default:
            return null;
    }
}
