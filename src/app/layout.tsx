import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
    title: "Shadow CEO - 泥棒と警察の心理戦",
    description:
        "ノートの上でコマを動かして遊ぶ、泥棒と警察の非対称対戦ゲーム",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="ja">
                <head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link
                        rel="preconnect"
                        href="https://fonts.gstatic.com"
                        crossOrigin="anonymous"
                    />
                    <link
                        href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Klee+One&family=Noto+Sans+JP:wght@400;500;700&display=swap"
                        rel="stylesheet"
                    />
                </head>
                <body className="antialiased">{children}</body>
            </html>
        </ClerkProvider>
    );
}
