1. プロジェクト概要
9マスのグリッド（3x3）で行われる、泥棒と警察の非対称対戦ゲーム。 **「ノートの上でコマを動かして遊んでいる」**ような、優しく落ち着いた（Muted White）世界観を持つWebアプリケーション。 Next.js + Supabase Realtime を使用し、最大15ターンの心理戦をリアルタイムで同期する。

2. デザインコンセプト (UI/UX)
テーマ: "Sketch on a Notebook"

カラーパレット:

背景: オフホワイト / 生成り色 (#fdfbf7 - 紙の質感)

線・文字: 鉛筆のようなダークグレー (#4a4a4a)

アクセント（泥棒）: くすんだ赤 (#e07a5f)

アクセント（警察）: くすんだ青 (#3d5a80)

コンポーネント:

グリッドは方眼紙や手書き風の罫線で表現。

ボタンやコマは「手書きの落書き」のようなスタイル（border-radius を不均一にする、または手書き風フォントを使用）。

Tailwind CSS Variables を活用し、全体的に彩度を落としたMutedなトーンで統一。

3. 技術スタック (Strict Requirements)
Frontend: Next.js (App Router), Tailwind CSS, tailwind variables

Backend: Next.js Server Actions

Database: Supabase (PostgreSQL) + Prisma ORM

Realtime: Supabase Realtime (WebSocket)

Auth: Clerk (proxy.ts)

4. データベース設計 (Prisma Schema)
重要: Clerkのユーザーデータへのアクセスを最小限にするため、一度ログインしたユーザーは独自の User テーブルに保存し、ゲーム毎のデータは Player テーブルで管理する。

コード スニペット

// 1. ユーザーマスタ (Clerkと同期)
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  name      String
  imageUrl  String?
  players   Player[] 
  createdAt DateTime @default(now())
}

// 2. ゲームセッション
model Group {
  id          String   @id @default(cuid())
  status      String   @default("WAITING") // WAITING, PLAYING, FINISHED
  turnCount   Int      @default(0)         // 最大15ターン
  maxTurns    Int      @default(15)
  
  // 盤面ステータス
  thiefPos    Int      // 0~8 (泥棒の現在地 - 警察には非公開)
  copPos      Int[]    // [2, 5] (警察の現在地 - 全員に公開)
  
  // 足跡履歴: [{pos: 3, turn: 5}, ...] 
  // 警察が検査するまでクライアントには伏せられる
  footprints  Json     @default("[]")      
  
  lastAction  String?  // "警察が右下のマスを捜索しました" などのログ
  players     Player[]
  createdAt   DateTime @default(now())
}

// 3. 参加プレイヤー (UserとGroupの中間)
model Player {
  id          String   @id @default(cuid())
  role        String   @default("COP") // COP or THIEF
  
  // 投資情報 (このゲームの真の勝敗条件)
  // { "targetPlayerId": 100 } -> 誰に投資しているか
  investments Json?    

  userId      String
  user        User     @relation(fields: [userId], references: [id])
  groupId     String
  group       Group    @relation(fields: [groupId], references: [id])

  @@unique([userId, groupId])
}
5. ゲームルール (Game Logic)
基本設定
マップ: 3x3 の9マス。

勝利条件:

泥棒: 15ターン逃げ切る。

警察: 泥棒と同じマスに対して「逮捕」コマンドを成功させる。

投資ボーナス: ゲーム終了時、勝利した役に投資していたプレイヤーにポイントが入る（今回はロジックのみ実装）。

泥棒 (Thief)
移動: 上下左右の隣接マスへ移動（またはその場に留まる）。

情報: 警察の位置が常に見えている。

足跡: 移動するたびに footprints に {pos, turn} が記録される。

警察 (Cop)
移動: 上下左右の隣接マスへ移動。

アクション:

検査 (Inspect): 現在いるマスを調べる。過去3ターン以内に泥棒が踏んでいれば「足跡あり」と表示される。

逮捕 (Arrest): 隣接するマスを指定して確保を行う。成功すればゲーム終了。

6. 実装フロー (Development Steps)
Schema Setup: 上記Prisma Schemaを定義し、SupabaseへMigrate。

Auth Sync Logic:

Clerkログイン後、トップページで db.user.upsert を実行し、Clerk情報を User テーブルに同期する関数を実装。

Lobby UI:

部屋（Group）を作成し、Role（泥棒/警察）を選択して待機する画面。

Game Board UI (Notebook Style):

3x3のグリッドを描画。

手書き風の円（コマ）を配置。

Supabase Realtime で Group テーブルの更新を購読し、コマをアニメーションさせる。

Turn Logic:

泥棒移動 → サーバー更新 → 警察移動 → サーバー更新のサイクル実装。

---
## 7. 現在の進捗状況 (Progress)
- [ ] Prisma Schema の作成と Migrate
- [ ] Clerk Auth と User同期ロジックの実装
- [ ] ロビー画面（Group作成）の実装
- [ ] ゲーム画面（3x3グリッド）の描画
- [ ] Supabase Realtime 接続とコマの移動同期
- [ ] 投資ロジックの実装
- [ ] 15ターン終了とリザルト処理