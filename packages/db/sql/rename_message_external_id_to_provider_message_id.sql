-- One-time fix if production still has Message.externalId after the Prisma schema rename.
-- Run in your Postgres shell (Vercel Postgres, Neon, etc.) only if the column is still named externalId.
-- If you already have providerMessageId, skip this (it will error).
ALTER TABLE "Message" RENAME COLUMN "externalId" TO "providerMessageId";
