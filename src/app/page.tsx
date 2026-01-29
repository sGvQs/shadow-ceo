import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUserAction } from "@/actions/user";
import Link from "next/link";

export default async function HomePage() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // ClerkユーザーをDBに同期
    await syncUserAction();

    return (
        <main className="min-h-dvh flex flex-col items-center justify-center p-8">
            <div className="paper-card max-w-md w-full text-center">
                <h1 className="mb-4">🎭 Shadow CEO</h1>
                <p className="text-ink-light mb-8 text-lg">
                    泥棒と警察の心理戦
                    <br />
                    <span className="text-ink-faint text-sm">
                        15ターンの駆け引きが、今始まる
                    </span>
                </p>

                <div className="space-y-4">
                    <Link href="/lobby" className="btn w-full block">
                        🎮 ロビーに入る
                    </Link>

                    <div className="flex gap-4 text-sm text-ink-faint">
                        <div className="flex-1 p-4 bg-paper-dark rounded-lg">
                            <span className="text-thief font-notebook text-lg">泥棒</span>
                            <p className="mt-1">15ターン逃げ切れ</p>
                        </div>
                        <div className="flex-1 p-4 bg-paper-dark rounded-lg">
                            <span className="text-cop font-notebook text-lg">警察</span>
                            <p className="mt-1">泥棒を逮捕せよ</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
