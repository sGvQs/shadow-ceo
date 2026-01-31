/**
 * ロビー画面
 * ルーム一覧・作成・参加
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface RoomInfo {
    id: number;
    name: string;
    code: string;
    maxPlayers: number;
    currentPlayers: number;
    isActive: boolean;
}

export default function LobbyPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // モーダル状態
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // ルーム一覧を取得
    const fetchRooms = useCallback(async () => {
        try {
            const res = await fetch('/api/rooms');
            if (!res.ok) throw new Error('ルーム一覧の取得に失敗しました');
            const data = await res.json();
            setRooms(data.rooms);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isLoaded && user) {
            fetchRooms();
        }
    }, [isLoaded, user, fetchRooms]);

    // ルーム作成
    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newRoomName.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'ルームの作成に失敗しました');
            }

            const room = await res.json();
            router.push(`/chat/${room.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setSubmitting(false);
        }
    };

    // コードで参加
    const handleJoinByCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/rooms/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: joinCode.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'ルームが見つかりません');
            }

            const room = await res.json();
            router.push(`/chat/${room.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setSubmitting(false);
        }
    };

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
                    <p>ロビーに入室するにはログインしてください。</p>
                    <SignInButton mode="modal">
                        <button className={styles.primaryButton}>ログイン</button>
                    </SignInButton>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* ヘッダー */}
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Rights</h1>
                    <span className={styles.subtitle}>ライツ</span>
                </div>
                <span className={styles.welcomeText}>
                    ようこそ、{user.firstName || user.username || 'プレイヤー'}さん
                </span>
            </header>

            {/* エラー表示 */}
            {error && (
                <div className={styles.errorBanner}>
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* アクションボタン */}
            <div className={styles.actions}>
                <button
                    className={styles.primaryButton}
                    onClick={() => setShowCreateModal(true)}
                >
                    ルームを作成
                </button>
                <button
                    className={styles.secondaryButton}
                    onClick={() => setShowJoinModal(true)}
                >
                    コードで参加
                </button>
                <button
                    className={styles.secondaryButton}
                    onClick={fetchRooms}
                    disabled={loading}
                >
                    更新
                </button>
            </div>

            {/* ルーム一覧 */}
            <main className={styles.roomList}>
                <h2 className={styles.sectionTitle}>参加可能なルーム</h2>
                {loading ? (
                    <div className={styles.loadingInline}>
                        <div className={styles.spinnerSmall} />
                    </div>
                ) : rooms.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>現在参加可能なルームはありません</p>
                        <p className={styles.emptyHint}>新しいルームを作成してみましょう！</p>
                    </div>
                ) : (
                    <div className={styles.roomGrid}>
                        {rooms.map((room) => (
                            <div key={room.id} className={styles.roomCard}>
                                <div className={styles.roomInfo}>
                                    <h3 className={styles.roomName}>{room.name}</h3>
                                    <span className={styles.roomCode}>{room.code}</span>
                                </div>
                                <div className={styles.roomMeta}>
                                    <span className={styles.playerCount}>
                                        {room.currentPlayers} / {room.maxPlayers} 人
                                    </span>
                                    <button
                                        className={styles.joinButton}
                                        onClick={() => router.push(`/chat/${room.id}`)}
                                        disabled={room.currentPlayers >= room.maxPlayers}
                                    >
                                        参加
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ルーム作成モーダル */}
            {showCreateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>新しいルームを作成</h2>
                        <form onSubmit={handleCreateRoom}>
                            <input
                                type="text"
                                placeholder="ルーム名"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                className={styles.input}
                                maxLength={30}
                                autoFocus
                            />
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryButton}
                                    disabled={submitting || !newRoomName.trim()}
                                >
                                    {submitting ? '作成中...' : '作成'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* コード参加モーダル */}
            {showJoinModal && (
                <div className={styles.modalOverlay} onClick={() => setShowJoinModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>コードでルームに参加</h2>
                        <form onSubmit={handleJoinByCode}>
                            <input
                                type="text"
                                placeholder="ルームコード (6文字)"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className={styles.input}
                                maxLength={6}
                                autoFocus
                            />
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={() => setShowJoinModal(false)}
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    className={styles.primaryButton}
                                    disabled={submitting || joinCode.length !== 6}
                                >
                                    {submitting ? '検索中...' : '参加'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 装飾的なドットパターン */}
            <div className={styles.dotPattern} aria-hidden="true" />
        </div>
    );
}
