/**
 * Root Layout
 * Clerk認証プロバイダーとグローバルスタイルを適用
 */

import type { Metadata } from 'next';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
    title: 'Rights - ライツ',
    description: 'リアルタイムチャット＆ブラウザゲーム',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            <html lang="ja">
                <body>
                    <SignedOut>
                        {children}
                    </SignedOut>
                    <SignedIn>
                        {children}
                    </SignedIn>
                </body>
            </html>
        </ClerkProvider>
    );
}
