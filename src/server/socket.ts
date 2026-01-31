/**
 * Socket.io サーバー
 * Clerk認証付きリアルタイムチャット基盤（ルーム対応）
 */

import 'dotenv/config';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';
import jwt, { JwtHeader, SigningKeyCallback, JwtPayload } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    SocketAuthData,
    SocketData,
    ChatMessage,
    PlayerInfo,
} from '../types/socket';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// ====================================
// 初期化
// ====================================

const PORT = process.env.SOCKET_PORT || 3001;

// PostgreSQL接続プール
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Prisma Adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
});

const httpServer = createServer();

const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
>(httpServer, {
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// ====================================
// 認証ミドルウェア
// ====================================

io.use(async (socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>, next) => {
    try {
        const auth = socket.handshake.auth as SocketAuthData;

        if (!auth.token) {
            return next(new Error('認証トークンがありません'));
        }

        // Clerkトークンを検証（JWT手動検証）
        const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
        const clerkDomain = publishableKey.includes('pk_test_')
            ? publishableKey.replace('pk_test_', '').replace(/=+$/, '')
            : publishableKey.replace('pk_live_', '').replace(/=+$/, '');

        const decodedDomain = Buffer.from(clerkDomain, 'base64').toString('utf-8');
        const issuer = `https://${decodedDomain}`;

        const client = jwksClient({
            jwksUri: `${issuer}/.well-known/jwks.json`,
            cache: true,
            rateLimit: true,
        });

        const getKey = (header: JwtHeader, callback: SigningKeyCallback) => {
            client.getSigningKey(header.kid, (err, key) => {
                if (err || !key) {
                    callback(err || new Error('Signing key not found'));
                    return;
                }
                callback(null, key.getPublicKey());
            });
        };

        const decoded = await new Promise<JwtPayload>((resolve, reject) => {
            jwt.verify(auth.token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded as JwtPayload);
            });
        });

        if (!decoded || !decoded.sub) {
            return next(new Error('無効なトークンです'));
        }

        const clerkUserId = decoded.sub;

        // Userを取得または作成
        let user = await prisma.user.findFirst({
            where: {
                userIdp: {
                    clerkUserId: clerkUserId,
                },
            },
            include: {
                userIdp: true,
                player: true,
            },
        });

        // Userが存在しない場合は作成
        if (!user) {
            const clerkUser = await clerk.users.getUser(clerkUserId);

            user = await prisma.user.create({
                data: {
                    email: clerkUser.emailAddresses[0]?.emailAddress || `${clerkUserId}@placeholder.com`,
                    name: clerkUser.firstName || clerkUser.username || 'Anonymous',
                    userIdp: {
                        create: {
                            clerkUserId: clerkUserId,
                        },
                    },
                },
                include: {
                    userIdp: true,
                    player: true,
                },
            });
        }

        // Playerが存在しない場合は作成
        let player = user.player;
        if (!player) {
            player = await prisma.player.create({
                data: {
                    clerkUserId: clerkUserId,
                    displayName: user.name || 'Player',
                    userId: user.id,
                },
            });
        }

        // ソケットにユーザー情報を付与
        socket.data.clerkUserId = clerkUserId;
        socket.data.playerId = player.id;
        socket.data.playerName = player.displayName || 'Anonymous';

        next();
    } catch (error) {
        console.error('認証エラー:', error);
        next(new Error('認証に失敗しました'));
    }
});

// ====================================
// 接続イベント
// ====================================

io.on('connection', async (socket) => {
    const { playerId, playerName, clerkUserId } = socket.data;

    console.log(`[接続] Player: ${playerName} (ID: ${playerId})`);

    // ====================================
    // client:joinRoom イベント
    // ====================================

    socket.on('client:joinRoom', async (data) => {
        try {
            const { roomId } = data;

            // ルームが存在するか確認
            const room = await prisma.room.findUnique({
                where: { id: roomId },
                include: {
                    players: {
                        include: {
                            player: true,
                        },
                    },
                },
            });

            if (!room || !room.isActive) {
                socket.emit('server:error', { message: 'ルームが見つかりません' });
                return;
            }

            // プレイヤーをルームに追加（既に参加済みの場合は何もしない）
            await prisma.roomPlayer.upsert({
                where: {
                    roomId_playerId: {
                        roomId: roomId,
                        playerId: playerId,
                    },
                },
                update: {},
                create: {
                    roomId: roomId,
                    playerId: playerId,
                },
            });

            // Socket.ioルームに参加
            socket.join(`room:${roomId}`);
            socket.data.currentRoomId = roomId;

            // ルームメンバーリストを取得
            const updatedRoom = await prisma.room.findUnique({
                where: { id: roomId },
                include: {
                    players: {
                        include: {
                            player: true,
                        },
                    },
                },
            });

            const players: PlayerInfo[] = updatedRoom?.players.map((rp) => ({
                id: rp.player.id,
                displayName: rp.player.displayName || 'Anonymous',
                clerkUserId: rp.player.clerkUserId,
            })) || [];

            // 入室したユーザーにルーム情報を送信
            socket.emit('server:roomJoined', { roomId, players });

            // ルーム内の他のメンバーに通知
            socket.to(`room:${roomId}`).emit('server:playerJoined', {
                roomId,
                player: {
                    id: playerId,
                    displayName: playerName,
                    clerkUserId: clerkUserId,
                },
            });

            // メッセージ履歴を送信
            const recentMessages = await prisma.message.findMany({
                where: { roomId: roomId },
                take: 50,
                orderBy: { createdAt: 'desc' },
                include: {
                    player: true,
                },
            });

            const messageHistory: ChatMessage[] = recentMessages
                .reverse()
                .map((msg) => ({
                    id: msg.id,
                    content: msg.content,
                    playerId: msg.playerId,
                    playerName: msg.player.displayName || 'Anonymous',
                    clerkUserId: msg.player.clerkUserId,
                    roomId: msg.roomId,
                    createdAt: msg.createdAt.toISOString(),
                }));

            socket.emit('server:messageHistory', messageHistory);

            console.log(`[入室] Player: ${playerName} => Room: ${roomId}`);
        } catch (error) {
            console.error('ルーム参加エラー:', error);
            socket.emit('server:error', { message: 'ルームへの参加に失敗しました' });
        }
    });

    // ====================================
    // client:leaveRoom イベント
    // ====================================

    socket.on('client:leaveRoom', async (data) => {
        try {
            const { roomId } = data;

            // Socket.ioルームから退出
            socket.leave(`room:${roomId}`);
            socket.data.currentRoomId = undefined;

            // DBからRoomPlayerを削除
            await prisma.roomPlayer.deleteMany({
                where: {
                    roomId: roomId,
                    playerId: playerId,
                },
            });

            // 退出を通知
            socket.emit('server:roomLeft', { roomId });

            // ルーム内の他のメンバーに通知
            socket.to(`room:${roomId}`).emit('server:playerLeft', {
                roomId,
                playerId,
            });

            console.log(`[退室] Player: ${playerName} <= Room: ${roomId}`);
        } catch (error) {
            console.error('ルーム退出エラー:', error);
            socket.emit('server:error', { message: 'ルームからの退出に失敗しました' });
        }
    });

    // ====================================
    // client:sendMessage イベント
    // ====================================

    socket.on('client:sendMessage', async (data) => {
        try {
            if (!data.content || data.content.trim() === '') {
                socket.emit('server:error', { message: 'メッセージが空です' });
                return;
            }

            if (!data.roomId) {
                socket.emit('server:error', { message: 'ルームIDが指定されていません' });
                return;
            }

            // DBに保存
            const message = await prisma.message.create({
                data: {
                    content: data.content.trim(),
                    playerId: playerId,
                    roomId: data.roomId,
                },
                include: {
                    player: true,
                },
            });

            const chatMessage: ChatMessage = {
                id: message.id,
                content: message.content,
                playerId: message.playerId,
                playerName: message.player.displayName || 'Anonymous',
                clerkUserId: message.player.clerkUserId,
                roomId: message.roomId,
                createdAt: message.createdAt.toISOString(),
            };

            // ルーム内にのみブロードキャスト
            io.to(`room:${data.roomId}`).emit('server:broadcastMessage', chatMessage);

            console.log(`[メッセージ] Room:${data.roomId} ${playerName}: ${data.content}`);
        } catch (error) {
            console.error('メッセージ送信エラー:', error);
            socket.emit('server:error', { message: 'メッセージの送信に失敗しました' });
        }
    });

    // ====================================
    // 切断イベント
    // ====================================

    socket.on('disconnect', async () => {
        console.log(`[切断] Player: ${playerName} (ID: ${playerId})`);

        // 現在参加中のルームがあれば通知
        const currentRoomId = socket.data.currentRoomId;
        if (currentRoomId) {
            socket.to(`room:${currentRoomId}`).emit('server:playerLeft', {
                roomId: currentRoomId,
                playerId,
            });
        }
    });
});

// ====================================
// サーバー起動
// ====================================

httpServer.listen(PORT, () => {
    console.log(`
  ================================
  🚀 Socket.io サーバー起動
  ================================
  ポート: ${PORT}
  環境: ${process.env.NODE_ENV || 'development'}
  ================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('シャットダウン中...');
    await prisma.$disconnect();
    httpServer.close();
    process.exit(0);
});
