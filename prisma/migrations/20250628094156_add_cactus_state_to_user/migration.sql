-- CreateEnum
CREATE TYPE "CactusState" AS ENUM ('SAD', 'MEDIUM', 'HAPPY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cactusState" "CactusState" NOT NULL DEFAULT 'MEDIUM';
