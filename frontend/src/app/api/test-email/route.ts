import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 })
    }

    // Get current user's email from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server')
    const user = await clerkClient.users.getUser(userId)
    const userEmail = user.emailAddresses?.[0]?.emailAddress
    const userName = user.firstName || user.username || 'there'

    if (!userEmail) {
      return NextResponse.json({ error: 'No email found for user' }, { status: 400 })
    }

    console.log(`📧 Sending test email to ${userEmail}...`)

    // Send test email
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-daily-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        name: userName,
        type: 'daily_checkin',
        timezone: 'UTC',
        hoursSinceActivity: 1,
        userData: {
          userId,
          mood: 'happy',
          isNewUser: false,
          userAge: 100
        },
        taskSummary: {
          completedTasks: 5,
          totalTasks: 10,
          totalPoints: 100,
          mikeState: 'Happy',
          regularCompleted: 3,
          sustainableCompleted: 2,
          recentTasks: [
            { title: 'Test task 1', completed: true, created_at: new Date().toISOString() },
            { title: 'Test task 2', completed: false, created_at: new Date().toISOString() }
          ]
        }
      })
    })

    const emailResult = await emailResponse.json()

    if (emailResponse.ok) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${userEmail}!`,
        emailResult,
        instructions: 'Check your email inbox (and spam folder) for an email from Mike the Cactus!'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: emailResult
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error sending test email:', error)
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
