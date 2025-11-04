import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, type, timezone, hoursSinceActivity, userData, taskSummary } = body

    console.log('📧 Daily email request:', {
      to: email,
      name,
      type,
      timezone,
      hoursSinceActivity,
      userData: userData ? 'present' : 'missing',
      taskSummary: taskSummary ? 'present' : 'missing'
    })

    // Email service not configured - logging only
    console.log('⚠️ Email service not configured - email skipped')

    return NextResponse.json({
      success: true,
      emailSkipped: true,
      message: 'Email service not configured - logging only'
    })

  } catch (error) {
    console.error('❌ Error in send-daily-email:', error)
    return NextResponse.json({
      error: 'Failed to send daily email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}