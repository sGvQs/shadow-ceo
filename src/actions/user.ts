"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function syncUserAction() {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        throw new Error("認証されていません");
    }

    const clerkUser = await currentUser();

    if (!clerkUser) {
        throw new Error("ユーザー情報を取得できませんでした");
    }

    const user = await db.user.upsert({
        where: { clerkId },
        create: {
            clerkId,
            name:
                clerkUser.firstName ||
                clerkUser.username ||
                clerkUser.emailAddresses[0]?.emailAddress ||
                "プレイヤー",
            imageUrl: clerkUser.imageUrl,
        },
        update: {
            name:
                clerkUser.firstName ||
                clerkUser.username ||
                clerkUser.emailAddresses[0]?.emailAddress ||
                "プレイヤー",
            imageUrl: clerkUser.imageUrl,
        },
    });

    return user;
}

export async function getCurrentUser() {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return null;
    }

    const user = await db.user.findUnique({
        where: { clerkId },
    });

    return user;
}
