This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 6. よく使うコマンド

WebSocketサーバーを起動しないと、リアルタイム通信機能（チャットなど）は動作しません。
開発中は `npm run dev` とは別のターミナルで `npm run socket` を実行してください。

```bash
# 開発サーバー起動
npm run dev

# WebSocketサーバー起動（必須：別ターミナルで実行）
npm run socket

# PostgreSQL起動/停止
docker compose up -d
docker compose down

# Prismaスタジオ（DBブラウザ）
npx prisma studio

# マイグレーションリセット
npx prisma migrate reset

# マイグレーション作成・適用
npx prisma migrate dev --name <migration_name>

# スキーマ変更をDBに反映（開発時のみ）
npx prisma db push

# Prisma Client再生成
npx prisma generate

# 型チェック
npx tsc --noEmit

# リント
npm run lint
```
