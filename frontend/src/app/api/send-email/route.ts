import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, name, type, timezone, hoursSinceActivity, taskSummary } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Format time since last activity
    const timeSinceActivity = hoursSinceActivity 
      ? `${hoursSinceActivity} hour${hoursSinceActivity !== 1 ? 's' : ''}`
      : 'a while'

    let subject = ''
    let htmlContent = ''

    switch (type) {
      case 'daily_checkin':
        subject = '🌵 Your daily reset is ready!'
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; font-size: 28px; margin-bottom: 10px;">🌵</h1>
              <h2 style="color: #1f2937; margin-bottom: 10px;">Hey ${name}!</h2>
              <p style="color: #6b7280; font-size: 16px;">Your daily reset is ready - mood check-in and AI features refreshed!</p>
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
                Daily check-in enabled • <a href="#" style="color: #6b7280;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `
        break
      
      case 'first_task_reminder':
        subject = '🎉 Ready for your next task? Mike is waiting!'
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; font-size: 32px; margin-bottom: 10px;">🌵</h1>
              <h2 style="color: #1f2937; margin-bottom: 10px;">Great job, ${name}!</h2>
              <p style="color: #6b7280; font-size: 18px;">You completed your first task yesterday. Ready for another?</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
              <h3 style="color: #92400e; margin-bottom: 20px; text-align: center;">🌟 Special Surprise Inside!</h3>
              <p style="color: #92400e; text-align: center; font-size: 16px; line-height: 1.6;">
                We've prepared some personalized task suggestions just for you based on your mood and progress. 
                Come back and see what Mike has planned!
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
                See Your Surprise! 🎁
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 14px;">
                Keep building those habits! Mike believes in you.
                <br>
                <a href="#" style="color: #6b7280;">Unsubscribe</a> | 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #6b7280;">Dashboard</a>
              </p>
            </div>
          </div>
        `
        break
      
      case 'daily_reset':
        const completedCount = taskSummary?.completed_count || 0
        const notCompletedCount = taskSummary?.not_completed_count || 0
        const totalCount = taskSummary?.total || 0
        
        subject = '🌵 Daily Reset Complete - Your Task Summary'
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #ffffff;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 48px; margin-bottom: 16px;">🌵</div>
              <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">Daily Reset Complete</h1>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">Your mood check-in and AI features are refreshed</p>
            </div>
            
            <!-- Stats Grid -->
            <div style="background: #f9fafb; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; text-align: center;">
                <div>
                  <div style="font-size: 32px; font-weight: 700; color: #059669; line-height: 1;">${completedCount}</div>
                  <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-top: 4px;">Completed</div>
                </div>
                <div>
                  <div style="font-size: 32px; font-weight: 700; color: #dc2626; line-height: 1;">${notCompletedCount}</div>
                  <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-top: 4px;">Not Completed</div>
                </div>
                <div>
                  <div style="font-size: 32px; font-weight: 700; color: #2563eb; line-height: 1;">${totalCount}</div>
                  <div style="font-size: 14px; color: #6b7280; font-weight: 500; margin-top: 4px;">Total</div>
                </div>
              </div>
            </div>
            
            <!-- Task Lists -->
            ${completedCount > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #059669; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">✅ Completed Tasks</h3>
                <div style="background: #f0fdf4; border-radius: 12px; padding: 16px;">
                  ${taskSummary?.completed?.map(task => `
                    <div style="color: #166534; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #dcfce7; display: flex; align-items: center;">
                      <span style="margin-right: 8px;">✓</span>
                      <span>${task}</span>
                    </div>
                  `).join('') || ''}
                </div>
              </div>
            ` : ''}
            
            ${notCompletedCount > 0 ? `
              <div style="margin-bottom: 24px;">
                <h3 style="color: #dc2626; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">❌ Not Completed</h3>
                <div style="background: #fef2f2; border-radius: 12px; padding: 16px;">
                  ${taskSummary?.not_completed?.map(task => `
                    <div style="color: #991b1b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #fecaca; display: flex; align-items: center;">
                      <span style="margin-right: 8px;">×</span>
                      <span>${task}</span>
                    </div>
                  `).join('') || ''}
                </div>
              </div>
            ` : ''}
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="display: inline-block; background: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);">
                Start Fresh Today 🌵
              </a>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Daily reset completed • <a href="#" style="color: #6b7280; text-decoration: none;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        )
    }

    const { data, error } = await resend.emails.send({
      from: 'Mike from Teyra <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: htmlContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 