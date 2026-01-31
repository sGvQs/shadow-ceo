# Realtime Chat App Requirement (Phase 1)

## 1. Project Overview
**ゴール:** 将来的にマルチプレイヤーブラウザゲームへ発展させるための基盤として、Next.js + Socket.io + Clerk を用いたリアルタイムチャットアプリケーションを構築する。
**現在のフェーズ:** Phase 1 (環境構築、認証、WebSocket疎通確認、最低限のDB保存)

## 2. Tech Stack
* **Frontend:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
* **Backend / WebSocket:** Node.js (Custom Server) with `socket.io`
    * *Note:* 将来的なゲームループ実装のため、Serverlessではなく常駐型のNode.jsサーバー（または `server.ts`）を使用する。
* **Database / ORM:** PostgreSQL (Neon), Prisma
* **Auth:** Clerk (Next.js SDK)
* **Package Manager:** npm or pnpm

## 3. Core Features (MVP)
### 3.1 Authentication (Clerk)
* Googleアカウント等でのサインイン/サインアップ。
* 保護されたルート (`/dashboard` または `/game`) の作成。

### 3.2 Database Schema (Prisma)
将来の拡張を見据え、認証ユーザー(`User`)とゲーム内の実体(`Player`)を概念的に分ける。

```
model User {
  id          Int           @id @default(autoincrement())
  email       String        @unique
  name        String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  userIdp     UserIdp?
  expenses    Expense[]     
  groups        Group[]
  personalExpenses PersonalExpense[]
  personalBudgets PersonalBudget[]
  createdGroups CreatedGroup[]
  pastGroups    PastGroup[]
}

model UserIdp {
  id          Int    @id @default(autoincrement())
  clerkUserId String @unique 
  user        User   @relation(fields: [userId], references: [id])
  userId      Int    @unique
}

model Player {
  id          Int    @id @default(autoincrement())
  clerkUserId String @unique 
  user        User   @relation(fields: [userId], references: [id])
  userId      Int    @unique
}
```

### 3.3 WebSocket Server (Socket.io)
* Next.jsとは別のポート（例: 3001）またはカスタムサーバーとして起動。
* **重要: 認証ハンドシェイク**
    * クライアント接続時にClerkのTokenを検証し、`userId` を特定する。
    * DBに `Player` レコードが存在しない場合、初回接続時に作成(upsert)するロジックを含める。
* イベント:
    * `client:sendMessage`: メッセージ受信 -> DB保存 -> 全員に `server:broadcastMessage`。

### 3.4 UI / UX
* 画面左側: チャットログ（スクロール可能）。
* 画面下部: 入力フォームと送信ボタン。
* 自分のメッセージと他人のメッセージでスタイルを少し変える（右寄せ/左寄せなど）。

## 4. Implementation Steps for AI
以下の手順でコードを生成・実装してください。

1.  **Environment Setup:** Next.jsプロジェクトの初期化と必要なパッケージ(`socket.io`, `socket.io-client`, `prisma`, `@clerk/nextjs` 等)のインストールコマンド。
2.  **Database:** `schema.prisma` の定義とマイグレーション手順。
3.  **Socket Server:** `server.ts` (または `backend/server.ts`) の作成。Clerk認証ミドルウェアを含むSocket.ioサーバーの構築。
4.  **Frontend Logic:** `useSocket` カスタムフックの作成（接続、切断、イベントリスナーの管理）。
5.  **UI Construction:** チャット画面のコンポーネント実装。

## 5. Coding Guidelines
* **Type Safety:** `any` 型の使用は避け、TypeScriptの型定義を厳格に行うこと。
* **Directory Structure:** `src/` ディレクトリを使用する。
* **Environment Variables:** 秘密情報は `.env` から読み込むこと。
* **Validation:** 2つのブラウザタブを開き、片方で送信した内容がもう片方に即座に反映されることを動作完了の定義とする。