import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getUserProgress, updateUserProgress } from '@/lib/db-service';

// Milestones configuration (copied from db-service.ts)
const MILESTONES = [
  { threshold: 0, mood: 'overwhelmed', maxValue: 10 },
  { threshold: 10, mood: 'neutral', maxValue: 15 },
  { threshold: 25, mood: 'energized', maxValue: 20 },
  { threshold: 45, mood: 'excited', maxValue: 25 }
];

function getCurrentMilestone(allTimeCompleted: number) {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (allTimeCompleted >= MILESTONES[i].threshold) {
      return MILESTONES[i];
    }
  }
  return MILESTONES[0];
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Get current progress
    const progress = await getUserProgress(userId);
    
    // Calculate the correct milestone based on all-time completed
    const currentMilestone = getCurrentMilestone(progress.allTimeCompleted);
    
    // Reset daily completed tasks to 0 and update milestone
    progress.completedTasks = 0;
    progress.dailyCompletedTasks = 0;
    progress.maxValue = currentMilestone.maxValue;
    progress.mood = currentMilestone.mood;
    
    // Update the progress
    await updateUserProgress(userId, progress);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Milestone progress reset successfully',
      progress: {
        completedTasks: progress.completedTasks,
        maxValue: progress.maxValue,
        allTimeCompleted: progress.allTimeCompleted,
        mood: progress.mood
      }
    });
    
  } catch (error) {
    console.error('Error resetting milestone progress:', error);
    return NextResponse.json({ error: 'Failed to reset progress' }, { status: 500 });
  }
} 