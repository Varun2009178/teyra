-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasSeenCompletionPopup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSeenIntroPopup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSeenStreakPopup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;
