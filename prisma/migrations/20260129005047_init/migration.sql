-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('LOBBY', 'INVESTING', 'PLAYING', 'FINISHED');

-- CreateEnum
CREATE TYPE "RandomBonusType" AS ENUM ('SHORTEST_ROAD_BONUS', 'MOST_RESOURCE_BONUS', 'LEAST_MONEY_BONUS', 'MOST_OFFICES_BONUS', 'RANDOM_PLAYER_BONUS');

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'LOBBY',
    "currentTurnPlayerId" TEXT,
    "boardState" JSONB NOT NULL,
    "randomBonusEvent" "RandomBonusType",
    "turnOrder" TEXT[],
    "winnerPlayerId" TEXT,
    "devCardDeck" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "resourceState" JSONB NOT NULL DEFAULT '{"food":0,"gold":0,"concrete":0,"wood":0,"oil":0,"rareMetal":0}',
    "businessPoints" INTEGER NOT NULL DEFAULT 0,
    "roads" JSONB NOT NULL DEFAULT '[]',
    "offices" JSONB NOT NULL DEFAULT '[]',
    "devCards" JSONB NOT NULL DEFAULT '[]',
    "devCardsUsed" INTEGER NOT NULL DEFAULT 0,
    "hasPoliceChief" BOOLEAN NOT NULL DEFAULT false,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "finalMoney" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "targetPlayerId" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameLog" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT,
    "action" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_code_key" ON "GameSession"("code");

-- CreateIndex
CREATE INDEX "Player_gameId_idx" ON "Player"("gameId");

-- CreateIndex
CREATE INDEX "Player_clerkUserId_idx" ON "Player"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_gameId_clerkUserId_key" ON "Player"("gameId", "clerkUserId");

-- CreateIndex
CREATE INDEX "Investment_investorId_idx" ON "Investment"("investorId");

-- CreateIndex
CREATE INDEX "Investment_targetPlayerId_idx" ON "Investment"("targetPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "Investment_investorId_targetPlayerId_key" ON "Investment"("investorId", "targetPlayerId");

-- CreateIndex
CREATE INDEX "GameLog_gameId_idx" ON "GameLog"("gameId");

-- CreateIndex
CREATE INDEX "GameLog_gameId_createdAt_idx" ON "GameLog"("gameId", "createdAt");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_targetPlayerId_fkey" FOREIGN KEY ("targetPlayerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameLog" ADD CONSTRAINT "GameLog_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
