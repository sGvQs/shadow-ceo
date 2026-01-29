import type {
    HexTile,
    HexResourceType,
    BoardState,
    VertexPosition,
    EdgePosition,
} from '@/types/game';

// ヘックスの軸座標 (Axial coordinates)
interface AxialCoord {
    q: number;
    r: number;
}

// 13枚構成のヘックス座標
const HEX_POSITIONS: AxialCoord[] = [
    // 中央
    { q: 0, r: 0 },
    // 周囲6枚
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: -1, r: 0 },
    { q: 0, r: -1 },
    { q: 1, r: -1 },
    // 外周6枚
    { q: 2, r: -1 },
    { q: 1, r: 1 },
    { q: -1, r: 2 },
    { q: -2, r: 1 },
    { q: -1, r: -1 },
    { q: 1, r: -2 },
];

// 資源タイプの配布（13枚用）
const RESOURCE_DISTRIBUTION: HexResourceType[] = [
    'food', 'food', 'food',      // 食料 3枚
    'gold', 'gold',               // 金 2枚
    'concrete', 'concrete',       // コンクリート 2枚
    'wood', 'wood',               // 木材 2枚
    'oil', 'oil',                 // 石油 2枚
    'rareMetal',                  // レアメタル 1枚
    'desert',                     // 砂漠 1枚
];

// ダイス番号の配布（砂漠以外の12枚用）
const DICE_NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

// 配列をシャッフル
function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

// ボードを生成
export function generateBoard(): BoardState {
    const shuffledResources = shuffle(RESOURCE_DISTRIBUTION);
    const shuffledDice = shuffle(DICE_NUMBERS);

    let diceIndex = 0;
    const tiles: HexTile[] = HEX_POSITIONS.map((pos, index) => {
        const resourceType = shuffledResources[index];
        const diceNumber = resourceType === 'desert' ? null : shuffledDice[diceIndex++];

        return {
            id: `tile-${index}`,
            position: pos,
            resourceType,
            diceNumber,
            hasCop: resourceType === 'desert', // 砂漠に初期配置
        };
    });

    const desertTile = tiles.find(t => t.resourceType === 'desert');

    return {
        tiles,
        roads: [],
        offices: [],
        copTileId: desertTile?.id ?? null,
    };
}

// 軸座標からピクセル座標への変換
export function axialToPixel(q: number, r: number, size: number): { x: number; y: number } {
    const x = size * (3 / 2 * q);
    const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
    return { x, y };
}

// ダイスロール時に資源を獲得するタイルを取得
export function getTilesForDice(board: BoardState, diceSum: number): HexTile[] {
    return board.tiles.filter(
        tile => tile.diceNumber === diceSum && !tile.hasCop
    );
}

// 頂点が隣接するヘックスタイルIDを取得
export function getAdjacentTiles(
    board: BoardState,
    vertex: VertexPosition
): HexTile[] {
    // 実装は複雑なので簡略化
    // 実際には頂点の座標から隣接する3つのヘックスを計算
    const tile = board.tiles.find(t => t.id === vertex.hexId);
    if (!tile) return [];
    return [tile]; // TODO: 完全な隣接計算
}

// 辺が隣接するヘックスタイルIDを取得
export function getAdjacentTilesForEdge(
    board: BoardState,
    edge: EdgePosition
): HexTile[] {
    const tile = board.tiles.find(t => t.id === edge.hexId);
    if (!tile) return [];
    return [tile]; // TODO: 完全な隣接計算
}

// 頂点位置を一意のキーに変換
export function vertexKey(pos: VertexPosition): string {
    return `${pos.hexId}-v${pos.direction}`;
}

// 辺位置を一意のキーに変換
export function edgeKey(pos: EdgePosition): string {
    return `${pos.hexId}-e${pos.direction}`;
}

// ダイスを振る
export function rollDice(): { dice1: number; dice2: number; sum: number } {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return { dice1, dice2, sum: dice1 + dice2 };
}
