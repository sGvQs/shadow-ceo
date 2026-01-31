'use server';

import { revalidatePath } from 'next/cache';
import { createRoom, findRoomByCode } from '@/backend/services/rooms';
import { redirect } from 'next/navigation';

export type ActionState = {
    error?: string;
    success?: boolean;
    data?: any;
};

export async function createRoomAction(name: string): Promise<ActionState> {
    try {
        const room = await createRoom(name);
        revalidatePath('/lobby');
        return { success: true, data: room };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'ルーム作成に失敗しました',
        };
    }
}

export async function joinRoomAction(code: string): Promise<ActionState> {
    try {
        const room = await findRoomByCode(code);
        // ここではリダイレクトせず、クライアント側でリダイレクトさせるためにデータを返す
        return { success: true, data: room };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'ルーム参加に失敗しました',
        };
    }
}
