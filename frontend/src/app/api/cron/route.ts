import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userProgress } from '@/lib/schema'
import { eq, lt, or, isNull } from 'drizzle-orm'

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🕐 Cron job triggered')
    
    // Step 1: 24-hour daily reset (regardless of activity)
    console.log('🔄 Processing 24-hour daily resets...')
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Get users who need daily reset
    const usersForReset = await db
      .select()
      .from(userProgress)
      .where(
        or(
          isNull(userProgress.lastResetDate),
          lt(userProgress.lastResetDate, twentyFourHoursAgo)
        )
      )

    let resetsCompleted = 0
    let emailsSent = 0

    if (usersForReset && usersForReset.length > 0) {
      console.log(`🔄 Found ${usersForReset.length} users who need daily reset`)
      
      for (const user of usersForReset) {
        try {
          // Reset daily limits for this user
          await db
            .update(userProgress)
            .set({ 
              dailyMoodChecks: 0,
              dailyAISplits: 0,
              lastResetDate: new Date()
            })
            .where(eq(userProgress.userId, user.userId))

          resetsCompleted++
          console.log(`✅ Reset completed for user ${user.userId}`)

        } catch (error) {
          console.error(`❌ Error resetting user ${user.userId}:`, error)
        }
      }
    } else {
      console.log('✅ No users need daily reset')
    }

    // Step 2: 48-hour email notifications for inactive users
    console.log('📧 Processing 48-hour email notifications...')
    
    // For now, we'll skip email notifications since we don't have email field in userProgress
    // You can add this later if needed
    console.log('📧 Email notifications skipped (not implemented with current schema)')

    return NextResponse.json({
      success: true,
      message: 'Cron job completed successfully',
      resetsCompleted,
      emailsSent,
      totalUsers: usersForReset?.length || 0
    })

  } catch (error) {
    console.error('❌ Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 