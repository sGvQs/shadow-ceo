// ゲームで使用するリソースタイプ
export type ResourceType = 'food' | 'gold' | 'concrete' | 'wood' | 'oil' | 'rareMetal';

// プレイヤーのリソース状態
export interface ResourceState {
  food: number;
  gold: number;
  concrete: number;
  wood: number;
  oil: number;
  rareMetal: number;
}

// 初期リソース状態
export const INITIAL_RESOURCE_STATE: ResourceState = {
  food: 0,
  gold: 0,
  concrete: 0,
  wood: 0,
  oil: 0,
  rareMetal: 0,
};

// ヘックスタイルの資源タイプ
export type HexResourceType = ResourceType | 'desert';

// ヘックスタイル
export interface HexTile {
  id: string;
  position: { q: number; r: number }; // Axial座標
  resourceType: HexResourceType;
  diceNumber: number | null; // 砂漠はnull
  hasCop: boolean; // 悪徳警官がいるか
}

// 辺の位置（道の建設用）
export interface EdgePosition {
  hexId: string;
  direction: 0 | 1 | 2 | 3 | 4 | 5; // 6方向
}

// 頂点の位置（オフィス建設用）
export interface VertexPosition {
  hexId: string;
  direction: 0 | 1 | 2 | 3 | 4 | 5; // 6頂点
}

// 道
export interface Road {
  id: string;
  playerId: string;
  position: EdgePosition;
}

// オフィス
export interface Office {
  id: string;
  playerId: string;
  position: VertexPosition;
  level: 'startup' | 'enterprise'; // 小/大
}

// 盤面状態
export interface BoardState {
  tiles: HexTile[];
  roads: Road[];
  offices: Office[];
  copTileId: string | null;
}

// 指示カードタイプ
export type DevCardType =
  | 'insider_trading'    // インサイダー取引
  | 'labor_inspection'   // 労基署のガサ入れ
  | 'dx_promotion'       // DX推進
  | 'personnel_change';  // 人事異動

// 指示カード
export interface DevCard {
  id: string;
  type: DevCardType;
  isUsed: boolean;
}

// 指示カードの詳細
export const DEV_CARD_INFO: Record<DevCardType, { name: string; description: string }> = {
  insider_trading: {
    name: 'インサイダー取引',
    description: '山札から好きな資源1枚を獲得',
  },
  labor_inspection: {
    name: '労基署のガサ入れ',
    description: '他全員から「食料」を1枚ずつ奪う',
  },
  dx_promotion: {
    name: 'DX推進',
    description: '指定した資源1種を他全員からすべて奪う（独占）',
  },
  personnel_change: {
    name: '人事異動',
    description: '警官を移動させる',
  },
};

// 建設コスト
export const BUILD_COSTS = {
  road: { concrete: 1, wood: 1 } as Partial<ResourceState>,
  startup: { wood: 1, food: 1 } as Partial<ResourceState>,
  enterprise: { oil: 1, rareMetal: 1, food: 1 } as Partial<ResourceState>, // アップグレード
  devCard: { gold: 1, oil: 1, rareMetal: 1 } as Partial<ResourceState>,
};

// 建設物のビジネスポイント
export const BUILD_BP = {
  road: 0,
  startup: 1,
  enterprise: 2, // 小からのアップグレードで+1
  devCard: 0,
};

// プレイヤーカラー
export const PLAYER_COLORS = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
] as const;

// ゲームアクション
export type GameAction =
  | { type: 'DICE_ROLL'; playerId: string; dice1: number; dice2: number }
  | { type: 'BUILD_ROAD'; playerId: string; position: EdgePosition }
  | { type: 'BUILD_STARTUP'; playerId: string; position: VertexPosition }
  | { type: 'UPGRADE_OFFICE'; playerId: string; officeId: string }
  | { type: 'EXCHANGE_GOLD'; playerId: string; targetResource: ResourceType }
  | { type: 'COP_MOVE'; playerId: string; tileId: string; isBribe: boolean }
  | { type: 'USE_DEV_CARD'; playerId: string; cardId: string; data?: unknown }
  | { type: 'END_TURN'; playerId: string }
  | { type: 'TAX_COLLECTED'; playerId: string; goldLost: number };

// ランダムボーナスタイプ
export type RandomBonusType =
  | 'SHORTEST_ROAD_BONUS'
  | 'MOST_RESOURCE_BONUS'
  | 'LEAST_MONEY_BONUS'
  | 'MOST_OFFICES_BONUS'
  | 'RANDOM_PLAYER_BONUS';

export const RANDOM_BONUS_INFO: Record<RandomBonusType, { name: string; bp: number }> = {
  SHORTEST_ROAD_BONUS: { name: '道が最短の人', bp: 5 },
  MOST_RESOURCE_BONUS: { name: '資源最多保持者', bp: 3 },
  LEAST_MONEY_BONUS: { name: '金最少保持者', bp: 4 },
  MOST_OFFICES_BONUS: { name: 'オフィス最多', bp: 3 },
  RANDOM_PLAYER_BONUS: { name: 'ランダム1人', bp: 5 },
};

// ゲーム終了条件
export const WIN_CONDITION_BP = 6;

// ダイス番号ごとの確率（ドット数）
export const DICE_PROBABILITY: Record<number, number> = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};
