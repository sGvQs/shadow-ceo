'use client';

import type { HexTile, BoardState, ResourceType } from '@/types/game';

// 資源タイプに対応する色
const RESOURCE_COLORS: Record<string, { bg: string; border: string }> = {
    food: { bg: '#22c55e', border: '#16a34a' },      // 緑（食料）
    gold: { bg: '#eab308', border: '#ca8a04' },      // 金
    concrete: { bg: '#6b7280', border: '#4b5563' },  // グレー（コンクリート）
    wood: { bg: '#854d0e', border: '#713f12' },      // 茶色（木材）
    oil: { bg: '#1e1e1e', border: '#000000' },       // 黒（石油）
    rareMetal: { bg: '#8b5cf6', border: '#7c3aed' }, // 紫（レアメタル）
    desert: { bg: '#d4a574', border: '#c4956a' },    // サンド（砂漠）
};

// 資源アイコン
const RESOURCE_ICONS: Record<string, string> = {
    food: '🌾',
    gold: '💰',
    concrete: '🧱',
    wood: '🪵',
    oil: '🛢️',
    rareMetal: '💎',
    desert: '🏜️',
};

interface HexBoardProps {
    boardState: BoardState;
    players: { id: string; color: string; displayName: string }[];
    onTileClick?: (tileId: string) => void;
    selectedTileId?: string;
}

// 軸座標からピクセル座標に変換
function axialToPixel(q: number, r: number, size: number): { x: number; y: number } {
    const x = size * (3 / 2) * q;
    const y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
    return { x, y };
}

// ヘックスのSVGパスを生成
function hexPath(size: number): string {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = size * Math.cos(angle);
        const y = size * Math.sin(angle);
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ');
}

export function HexBoard({ boardState, players, onTileClick, selectedTileId }: HexBoardProps) {
    const hexSize = 60;
    const tiles = boardState.tiles;

    // 中心を計算
    const positions = tiles.map(t => axialToPixel(t.position.q, t.position.r, hexSize));
    const minX = Math.min(...positions.map(p => p.x)) - hexSize;
    const maxX = Math.max(...positions.map(p => p.x)) + hexSize;
    const minY = Math.min(...positions.map(p => p.y)) - hexSize;
    const maxY = Math.max(...positions.map(p => p.y)) + hexSize;

    const width = maxX - minX + 40;
    const height = maxY - minY + 40;
    const offsetX = -minX + 20;
    const offsetY = -minY + 20;

    return (
        <div className="flex justify-center overflow-auto">
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="max-w-full"
            >
                <g transform={`translate(${offsetX}, ${offsetY})`}>
                    {tiles.map((tile) => {
                        const { x, y } = axialToPixel(tile.position.q, tile.position.r, hexSize);
                        const colors = RESOURCE_COLORS[tile.resourceType] || RESOURCE_COLORS.desert;
                        const icon = RESOURCE_ICONS[tile.resourceType] || '';
                        const isSelected = selectedTileId === tile.id;
                        const hasCop = tile.hasCop;

                        return (
                            <g
                                key={tile.id}
                                transform={`translate(${x}, ${y})`}
                                onClick={() => onTileClick?.(tile.id)}
                                className={onTileClick ? 'cursor-pointer' : ''}
                            >
                                {/* ヘックス本体 */}
                                <polygon
                                    points={hexPath(hexSize)}
                                    fill={colors.bg}
                                    stroke={isSelected ? '#f59e0b' : colors.border}
                                    strokeWidth={isSelected ? 4 : 2}
                                    opacity={hasCop ? 0.5 : 1}
                                />

                                {/* 資源アイコン */}
                                <text
                                    x="0"
                                    y="-15"
                                    textAnchor="middle"
                                    fontSize="24"
                                    dominantBaseline="middle"
                                >
                                    {icon}
                                </text>

                                {/* ダイス番号 */}
                                {tile.diceNumber && (
                                    <g>
                                        <circle
                                            cx="0"
                                            cy="15"
                                            r="14"
                                            fill="#1e293b"
                                            stroke="#475569"
                                            strokeWidth="2"
                                        />
                                        <text
                                            x="0"
                                            y="15"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="14"
                                            fontWeight="bold"
                                            fill={tile.diceNumber === 6 || tile.diceNumber === 8 ? '#ef4444' : '#ffffff'}
                                        >
                                            {tile.diceNumber}
                                        </text>
                                    </g>
                                )}

                                {/* 悪徳警官 */}
                                {hasCop && (
                                    <text
                                        x="0"
                                        y="0"
                                        textAnchor="middle"
                                        fontSize="36"
                                        dominantBaseline="middle"
                                    >
                                        👮
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* オフィス表示 */}
                    {boardState.offices.map((office) => {
                        const tile = tiles.find(t => t.id === office.position.hexId);
                        if (!tile) return null;
                        const player = players.find(p => p.id === office.playerId);
                        const { x, y } = axialToPixel(tile.position.q, tile.position.r, hexSize);
                        // 頂点位置のオフセット計算
                        const angle = (Math.PI / 3) * office.position.direction - Math.PI / 6;
                        const offsetX = hexSize * 0.8 * Math.cos(angle);
                        const offsetY = hexSize * 0.8 * Math.sin(angle);

                        return (
                            <g key={office.id} transform={`translate(${x + offsetX}, ${y + offsetY})`}>
                                {office.level === 'startup' ? (
                                    <rect
                                        x="-8"
                                        y="-8"
                                        width="16"
                                        height="16"
                                        fill={player?.color || '#888'}
                                        stroke="#000"
                                        strokeWidth="2"
                                        rx="2"
                                    />
                                ) : (
                                    <rect
                                        x="-12"
                                        y="-12"
                                        width="24"
                                        height="24"
                                        fill={player?.color || '#888'}
                                        stroke="#000"
                                        strokeWidth="3"
                                        rx="3"
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* 道表示 */}
                    {boardState.roads.map((road) => {
                        const tile = tiles.find(t => t.id === road.position.hexId);
                        if (!tile) return null;
                        const player = players.find(p => p.id === road.playerId);
                        const { x, y } = axialToPixel(tile.position.q, tile.position.r, hexSize);
                        // 辺の中央位置のオフセット計算
                        const angle = (Math.PI / 3) * road.position.direction;
                        const offsetX = hexSize * 0.7 * Math.cos(angle);
                        const offsetY = hexSize * 0.7 * Math.sin(angle);

                        return (
                            <line
                                key={road.id}
                                x1={x + offsetX * 0.5}
                                y1={y + offsetY * 0.5}
                                x2={x + offsetX * 1.5}
                                y2={y + offsetY * 1.5}
                                stroke={player?.color || '#888'}
                                strokeWidth="6"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}
