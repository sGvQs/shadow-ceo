import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function GameLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-dvh">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[var(--color-paper)] border-b-2 border-[var(--color-grid-accent)]">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="font-notebook text-2xl text-ink">
                        🎭 Shadow CEO
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/lobby"
                            className="text-ink-light hover:text-ink transition-colors"
                        >
                            ロビー
                        </Link>
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 border-2 border-[var(--color-ink-faint)]",
                                },
                            }}
                        />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>{children}</main>
        </div>
    );
}
