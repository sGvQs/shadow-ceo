'use client';

import { useState } from 'react';
import { SignInButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createRoomAction, joinRoomAction } from '@/backend/actions/rooms';
import { RoomSummary } from '@/backend/services/rooms';
import styles from '@/app/lobby/page.module.css';
import { User } from '@prisma/client';

interface LobbyClientProps {
    initialRooms: RoomSummary[];
    user: User | null;
}

export default function LobbyClient({ initialRooms, user }: LobbyClientProps) {
    const router = useRouter();
    // サーバーコンポーネントから渡された初期データを使用
    // 更新は router.refresh() で行うため、stateで管理する必要があるかは要検討だが
    // 即時反映のために、ここではpropsを直接表示または単純なstateで保持する
    // 今回はシンプルに router.refresh() 後の再レンダリングに任せるため、initialRoomsを表示する
    // (より高度なUXでは useOptimistic を使うが、今回はリフレッシュボタンで十分)
    const rooms = initialRooms;

    // ローディング状態はアクション実行時のみ
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // モーダル状態
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [joinCode, setJoinCode] = useState('');

    // ルーム一覧を更新
    const handleRefresh = async () => {
        setIsActionLoading(true);
        router.refresh();
        // refreshの完了を検知するのは難しいが、短時間のウェイトで擬似的に表現
        setTimeout(() => setIsActionLoading(false), 500);
    };

    // ルーム作成
    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;

        setIsActionLoading(true);
        setError(null);

        const res = await createRoomAction(newRoomName.trim());

        if (res.success && res.data) {
            // 成功したらチャットへ遷移
            router.push(`/chat/${res.data.id}`);
        } else {
            setError(res.error || 'ルーム作成に失敗しました');
            setIsActionLoading(false);
        }
    };

    // コードで参加
    const handleJoinByCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setIsActionLoading(true);
        setError(null);

        const res = await joinRoomAction(joinCode.trim());

        if (res.success && res.data) {
            router.push(`/chat/${res.data.id}`);
        } else {
            setError(res.error || 'ルームが見つかりません');
            setIsActionLoading(false);
        }
    };

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
                    ようこそ、{user.name || 'プレイヤー'}さん
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
                    onClick={handleRefresh}
                    disabled={isActionLoading}
                >
                    更新
                </button>
            </div>

            {/* ルーム一覧 */}
            <main className={styles.roomList}>
                <h2 className={styles.sectionTitle}>参加可能なルーム</h2>
                {rooms.length === 0 ? (
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
                                    disabled={isActionLoading || !newRoomName.trim()}
                                >
                                    {isActionLoading ? '作成中...' : '作成'}
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
                                    disabled={isActionLoading || joinCode.length !== 6}
                                >
                                    {isActionLoading ? '検索中...' : '参加'}
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
