import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ブラウザ用クライアント（Realtime購読用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Realtime Channel を作成するヘルパー
export function createGameChannel(groupId: string) {
    return supabase.channel(`game:${groupId}`, {
        config: {
            broadcast: {
                self: true,
            },
        },
    });
}
