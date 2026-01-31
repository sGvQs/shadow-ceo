
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/backend/db/client";
import { cache } from "react";
import { PrismaClient, Prisma } from "@prisma/client";

/**
 * Returns the internal database User object for the currently authenticated Clerk user.
 * If the user exists in Clerk but not in the DB, it creates the DB record.
 * Cached per request to avoid redundant DB calls.
 */
export const getAuthenticatedUser = cache(async () => {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return null;

    // 1. Try to find the internal user via UserIdp
    const userIdp = await prisma.userIdp.findUnique({
        where: { clerkUserId },
        include: { user: true },
    });

    if (userIdp) {
        return userIdp.user;
    }

    // 2. If not found, fetch Clerk user details to create the internal user
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown';

    // 3. Create User and UserIdp transactionally
    try {
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Check if email already exists (edge case where user might have been created manually or via another provider?)
            // For now, simpler to just create. If email collision is possible, we should handle it.
            // Assuming email is unique in schema.

            // Upsert user? Or just create. The schema has email @unique.
            // If we blindly create, we might hit unique constraint if same email but different clerk ID.
            // Let's try to find user by email first to link? 
            // Safe default: try find by email.
            let user = await tx.user.findUnique({ where: { email } });

            if (!user) {
                user = await tx.user.create({
                    data: {
                        email,
                        name,
                    },
                });
            }

            // Create Identity Link
            await tx.userIdp.create({
                data: {
                    clerkUserId,
                    userId: user.id,
                },
            });

            return user;
        });

        return result;
    } catch (error) {
        console.error("Failed to sync user:", error);
        return null;
    }
});
