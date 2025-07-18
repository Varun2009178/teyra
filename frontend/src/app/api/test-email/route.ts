import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, name = 'Test User' } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const subject = '🌵 Test Email - Your daily reset is ready!'
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; font-size: 28px; margin-bottom: 10px;">🌵</h1>
          <h2 style="color: #1f2937; margin-bottom: 10px;">Hey ${name}!</h2>
          <p style="color: #6b7280; font-size: 16px;">This is a test email - your daily reset is ready!</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #1f2937; margin-bottom: 16px; text-align: center; font-size: 18px;">✨ Daily Reset Complete</h3>
          <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Mood check-in available</li>
            <li>2 AI task splits refreshed</li>
            <li>Personalized suggestions ready</li>
          </ul>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Check In Now 🌵
          </a>
        </div>
        
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px;">
            🧪 Test email • Daily check-in enabled • <a href="#" style="color: #6b7280;">Unsubscribe</a>
          </p>
        </div>
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'Mike from Teyra <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: htmlContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send test email', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully!',
      data 
    })
  } catch (error) {
    console.error('Test email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 