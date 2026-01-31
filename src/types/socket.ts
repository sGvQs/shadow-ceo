/**
 * Socket.io イベント型定義
 * サーバー・クライアント間で共有する型を定義
 */

// ルーム情報の型
export interface RoomInfo {
  id: number;
  name: string;
  code: string;
  maxPlayers: number;
  currentPlayers: number;
  isActive: boolean;
}

// プレイヤー情報の型
export interface PlayerInfo {
  id: number;
  displayName: string;
  clerkUserId: string;
}

// メッセージの型定義
export interface ChatMessage {
  id: number;
  content: string;
  playerId: number;
  playerName: string;
  clerkUserId: string;
  roomId: number;
  createdAt: string;
}

// クライアント → サーバー イベント
export interface ClientToServerEvents {
  'client:joinRoom': (data: { roomId: number }) => void;
  'client:leaveRoom': (data: { roomId: number }) => void;
  'client:sendMessage': (data: { roomId: number; content: string }) => void;
  'client:typing': (data: { roomId: number }) => void;
  'client:stopTyping': (data: { roomId: number }) => void;
}

// サーバー → クライアント イベント
export interface ServerToClientEvents {
  'server:roomJoined': (data: { roomId: number; players: PlayerInfo[] }) => void;
  'server:roomLeft': (data: { roomId: number }) => void;
  'server:playerJoined': (data: { roomId: number; player: PlayerInfo }) => void;
  'server:playerLeft': (data: { roomId: number; playerId: number }) => void;
  'server:broadcastMessage': (message: ChatMessage) => void;
  'server:messageHistory': (messages: ChatMessage[]) => void;
  'server:error': (error: { message: string }) => void;
}

// ソケット認証データ
export interface SocketAuthData {
  token: string;
}

// 接続されたソケットに付与するデータ
export interface SocketData {
  clerkUserId: string;
  playerId: number;
  playerName: string;
  currentRoomId?: number;
}
