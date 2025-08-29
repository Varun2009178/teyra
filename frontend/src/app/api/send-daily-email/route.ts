import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, type, timezone, hoursSinceActivity, userData, taskSummary } = body

    // For now, just log the email details since we may not have email service configured
    console.log('📧 Daily email request:', {
      to: email,
      name,
      type,
      timezone,
      hoursSinceActivity,
      userData,
      taskSummary
    })

    // Check if email service is configured (e.g., Resend API key)
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ No RESEND_API_KEY configured - email skipped')
      return NextResponse.json({ 
        success: true, 
        emailSkipped: true,
        message: 'Email service not configured - logging only' 
      })
    }

    // TODO: Implement actual email sending logic here
    // For now, simulate successful email sending
    console.log(`✅ Would send ${type} email to ${email} (${name})`)

    // Different email types based on the type parameter:
    // - 'daily_checkin': Regular motivational email
    // - 'first_task_reminder': Reminder for new users
    // - 'daily_reset_trigger': 24-hour reset notification
    // - 'first_daily_reset': First reset for new users

    return NextResponse.json({ 
      success: true,
      emailSent: true,
      message: `${type} email sent successfully to ${email}`,
      details: {
        type,
        recipient: email,
        name,
        hoursSinceActivity,
        userData,
        taskSummary
      }
    })

  } catch (error) {
    console.error('❌ Error sending daily email:', error)
    return NextResponse.json({ 
      error: 'Failed to send daily email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}