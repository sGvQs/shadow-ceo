import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

// サーバーレス向けのPool設定
const pool = new Pool({
    connectionString,
    // 重要: サーバーレス関数1つにつき接続は1本に制限する
    // これにより、Lambdaが100個起動してもDB接続は最大100本に抑えられる
    max: 1,
    // アイドル状態の接続を閉じるまでの時間（ミリ秒）
    // Vercelの関数タイムアウトより短く設定し、早めに解放する
    idleTimeoutMillis: 20000,
    // 接続確立のタイムアウト
    connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        // 必要に応じてログを出力
        // log: ['query', 'info', 'warn', 'error'], 
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;