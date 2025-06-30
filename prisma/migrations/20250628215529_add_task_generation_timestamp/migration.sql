/*
  Warnings:

  - You are about to drop the column `lastTaskCompletionDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `onboardingComplete` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastTaskCompletionDate",
DROP COLUMN "onboardingComplete",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastTaskCompletedAt" TIMESTAMP(3),
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tasksLastGeneratedAt" TIMESTAMP(3),
ALTER COLUMN "cactusState" SET DEFAULT 'SAD';

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
