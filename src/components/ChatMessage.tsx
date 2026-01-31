/**
 * ChatMessage コンポーネント
 * 個々のチャットメッセージを表示
 */

import type { ChatMessage as ChatMessageType } from '@/types/socket';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
    message: ChatMessageType;
    isOwnMessage: boolean;
}

export function ChatMessage({ message, isOwnMessage }: ChatMessageProps) {
    const formattedTime = new Date(message.createdAt).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div
            className={`${styles.messageContainer} ${isOwnMessage ? styles.ownMessage : styles.otherMessage
                }`}
        >
            {!isOwnMessage && (
                <div className={styles.playerName}>{message.playerName}</div>
            )}
            <div className={styles.messageBubble}>
                <p className={styles.messageContent}>{message.content}</p>
                <span className={styles.messageTime}>{formattedTime}</span>
            </div>
        </div>
    );
}
