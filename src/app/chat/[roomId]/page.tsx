/**
 * チャットルーム画面
 * ルーム別リアルタイムチャット
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/nextjs';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    ChatMessage,
    PlayerInfo,
} from '@/types/socket';
import { ChatMessage as ChatMessageComponent } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import styles from './page.module.css';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export default function ChatRoomPage() {
    const { user, isLoaded } = useUser();
    const { getToken, isSignedIn } = useAuth();
    const params = useParams();
    const router = useRouter();
    const roomId = parseInt(params.roomId as string, 10);

    const socketRef = useRef<TypedSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [players, setPlayers] = useState<PlayerInfo[]>([]);
    const [error, setError] = useState<string | null>(null);

    // メッセージが追加されたら自動スクロール
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Socket接続
    useEffect(() => {
        if (!isSignedIn || !isLoaded || isNaN(roomId)) {
            return;
        }

        let mounted = true;

        const connectSocket = async () => {
            try {
                const token = await getToken();

                if (!token) {
                    return;
                }

                const socket: TypedSocket = io(SOCKET_URL, {
                    auth: { token },
                    transports: ['websocket', 'polling'],
                });

                socketRef.current = socket;

                socket.on('connect', () => {
                    if (mounted) {
                        setIsConnected(true);
                        setError(null);
                        // ルームに参加
                        socket.emit('client:joinRoom', { roomId });
                    }
                });

                socket.on('disconnect', () => {
                    if (mounted) {
                        setIsConnected(false);
                    }
                });

                socket.on('server:roomJoined', (data) => {
                    if (mounted) {
                        setPlayers(data.players);
                    }
                });

                socket.on('server:playerJoined', (data) => {
                    if (mounted) {
                        setPlayers((prev) => {
                            if (prev.find((p) => p.id === data.player.id)) return prev;
                            return [...prev, data.player];
                        });
                    }
                });

                socket.on('server:playerLeft', (data) => {
                    if (mounted) {
                        setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
                    }
                });

                socket.on('server:messageHistory', (history) => {
                    if (mounted) {
                        setMessages(history);
                    }
                });

                socket.on('server:broadcastMessage', (message) => {
                    if (mounted) {
                        setMessages((prev) => [...prev, message]);
                    }
                });

                socket.on('server:error', (err) => {
                    if (mounted) {
                        setError(err.message);
                    }
                });

                socket.on('connect_error', (err) => {
                    if (mounted) {
                        setError(`接続エラー: ${err.message}`);
                    }
                });
            } catch (err) {
                if (mounted) {
                    setError('ソケット接続に失敗しました');
                    console.error('[Socket] 初期化エラー:', err);
                }
            }
        };

        connectSocket();

        return () => {
            mounted = false;
            if (socketRef.current) {
                socketRef.current.emit('client:leaveRoom', { roomId });
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isSignedIn, isLoaded, roomId, getToken]);

    // メッセージ送信
    const sendMessage = useCallback(
        (content: string) => {
            if (socketRef.current && isConnected) {
                socketRef.current.emit('client:sendMessage', { roomId, content });
            } else {
                setError('接続されていません');
            }
        },
        [isConnected, roomId]
    );

    // 退室
    const handleLeave = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.emit('client:leaveRoom', { roomId });
        }
        router.push('/lobby');
    }, [roomId, router]);

    // 読み込み中
    if (!isLoaded) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <p>読み込み中...</p>
                </div>
            </div>
        );
    }

    // 未認証
    if (!user) {
        return (
            <div className={styles.container}>
                <div className={styles.authRequired}>
                    <h1 className={styles.title}>Rights</h1>
                    <span className={styles.subtitle}>ライツ</span>
                    <h2>ログインが必要です</h2>
                    <p>チャットに参加するにはログインしてください。</p>
                    <SignInButton mode="modal">
                        <button className={styles.loginButton}>ログイン</button>
                    </SignInButton>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* ヘッダー */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button className={styles.backButton} onClick={handleLeave}>
                        ← ロビー
                    </button>
                    <h1 className={styles.title}>Room #{roomId}</h1>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.playerCount}>
                        {players.length} 人参加中
                    </span>
                    <div className={styles.connectionStatus}>
                        <span
                            className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected
                                }`}
                        />
                        {isConnected ? '接続中' : '接続中...'}
                    </div>
                </div>
            </header>

            {/* エラー表示 */}
            {error && (
                <div className={styles.errorBanner}>
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* メッセージエリア */}
            <main className={styles.messagesArea}>
                {messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>まだメッセージがありません</p>
                        <p className={styles.emptyHint}>最初のメッセージを送信しましょう！</p>
                    </div>
                ) : (
                    <div className={styles.messagesList}>
                        {messages.map((message) => (
                            <ChatMessageComponent
                                key={message.id}
                                message={message}
                                isOwnMessage={message.clerkUserId === user.id}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* 入力エリア */}
            <ChatInput onSend={sendMessage} disabled={!isConnected} />

            {/* 装飾的なドットパターン */}
            <div className={styles.dotPattern} aria-hidden="true" />
        </div>
    );
}
