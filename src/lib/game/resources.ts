import type { ResourceState, ResourceType } from '@/types/game';
import { BUILD_COSTS } from '@/types/game';

// リソースが十分にあるかチェック
export function hasEnoughResources(
    current: ResourceState,
    required: Partial<ResourceState>
): boolean {
    for (const [key, amount] of Object.entries(required)) {
        const resourceKey = key as ResourceType;
        if ((current[resourceKey] ?? 0) < (amount ?? 0)) {
            return false;
        }
    }
    return true;
}

// リソースを消費
export function subtractResources(
    current: ResourceState,
    toSubtract: Partial<ResourceState>
): ResourceState {
    const result = { ...current };
    for (const [key, amount] of Object.entries(toSubtract)) {
        const resourceKey = key as ResourceType;
        result[resourceKey] = Math.max(0, result[resourceKey] - (amount ?? 0));
    }
    return result;
}

// リソースを追加
export function addResources(
    current: ResourceState,
    toAdd: Partial<ResourceState>
): ResourceState {
    const result = { ...current };
    for (const [key, amount] of Object.entries(toAdd)) {
        const resourceKey = key as ResourceType;
        result[resourceKey] = (result[resourceKey] ?? 0) + (amount ?? 0);
    }
    return result;
}

// 金の交換（金2 → 任意の資源1）
export function exchangeGold(
    current: ResourceState,
    targetResource: ResourceType
): ResourceState | null {
    if (current.gold < 2) {
        return null;
    }

    let result = subtractResources(current, { gold: 2 });
    result = addResources(result, { [targetResource]: 1 });
    return result;
}

// 建設可能かチェック
export function canBuild(
    resources: ResourceState,
    buildType: keyof typeof BUILD_COSTS
): boolean {
    return hasEnoughResources(resources, BUILD_COSTS[buildType]);
}

// リソースの合計数を取得
export function getTotalResources(resources: ResourceState): number {
    return Object.values(resources).reduce((sum, val) => sum + val, 0);
}

// 税務署の調査（7の目）: 金4枚以上なら半分没収
export function applyTaxInspection(resources: ResourceState): {
    newResources: ResourceState;
    goldLost: number;
} {
    if (resources.gold < 4) {
        return { newResources: resources, goldLost: 0 };
    }

    const goldLost = Math.floor(resources.gold / 2);
    const newResources = {
        ...resources,
        gold: resources.gold - goldLost,
    };

    return { newResources, goldLost };
}

// リソース名の日本語表示
export const RESOURCE_NAMES: Record<ResourceType, string> = {
    food: '食料',
    gold: '金',
    concrete: 'コンクリート',
    wood: '木材',
    oil: '石油',
    rareMetal: 'レアメタル',
};
