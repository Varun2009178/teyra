import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's progress data
    const userProgress = await db.query.userProgress.findFirst({
      where: (progress, { eq }) => eq(progress.userId, userId)
    });

    if (!userProgress) {
      return NextResponse.json({ error: 'User progress not found' }, { status: 404 });
    }

    const now = new Date();
    const lastResetDate = userProgress.lastResetDate ? new Date(userProgress.lastResetDate) : null;
    
    // Check if 24 hours have passed since last reset
    if (lastResetDate) {
      const timeSinceLastReset = now.getTime() - lastResetDate.getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (timeSinceLastReset >= twentyFourHours) {
        // Timer has expired, send email
        try {
          const emailResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              type: 'daily-reset',
              userEmail: userProgress.userEmail || '',
              userName: userProgress.userName || 'User'
            })
          });

          if (emailResponse.ok) {
            // Update last reset date to now
            await db.update(userProgress).set({
              lastResetDate: now.toISOString(),
              dailyCompletedTasks: 0,
              dailyMoodChecks: 0,
              dailyAISplits: 0
            });

            return NextResponse.json({ 
              success: true, 
              message: 'Timer expired, email sent and reset completed',
              expired: true 
            });
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Timer not expired',
      expired: false 
    });

  } catch (error) {
    console.error('Error checking timer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 