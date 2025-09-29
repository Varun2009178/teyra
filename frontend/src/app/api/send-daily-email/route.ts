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

    // Check if email service is configured
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ No RESEND_API_KEY configured - email skipped')
      return NextResponse.json({ 
        success: true, 
        emailSkipped: true,
        message: 'Email service not configured - logging only' 
      })
    }

    // Import Resend dynamically to avoid build issues if not configured
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate personalized email content based on type and user data
    const emailContent = generateEmailContent(type, name, userData, taskSummary, hoursSinceActivity);

    try {
      const emailResult = await resend.emails.send({
        from: 'Mike the Cactus <onboarding@resend.dev>',
        to: [email],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        headers: {
          'X-Entity-Ref-ID': `teyra-${type}-${Date.now()}`,
        },
      });

      console.log(`✅ Email sent successfully to ${email}:`, emailResult);

      return NextResponse.json({ 
        success: true,
        emailSent: true,
        emailId: emailResult.data?.id,
        message: `${type} email sent successfully to ${email}`,
        details: {
          type,
          recipient: email,
          name,
          hoursSinceActivity,
          subject: emailContent.subject
        }
      })

    } catch (emailError) {
      console.error('❌ Resend API error:', emailError);
      
      return NextResponse.json({ 
        success: false,
        emailSent: false,
        error: 'Failed to send email via Resend',
        details: emailError instanceof Error ? emailError.message : 'Unknown email error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in send-daily-email:', error)
    return NextResponse.json({ 
      error: 'Failed to send daily email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateEmailContent(type: string, name: string, userData: any, taskSummary: any, hoursSinceActivity: number) {
  const firstName = name?.split(' ')[0] || 'there';
  
  switch (type) {
    case 'daily_checkin':
      return {
        subject: `🌵 Mike here! How's your productivity going, ${firstName}?`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 28px; margin: 0; font-weight: 800;">🌵 Hey ${firstName}!</h1>
              <p style="font-size: 16px; opacity: 0.9; margin: 10px 0;">Mike the Cactus here with your daily check-in</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2 style="font-size: 20px; margin: 0 0 15px 0;">📊 Your Progress</h2>
              ${taskSummary ? `
                <p>✅ Tasks completed: <strong>${taskSummary.completedTasks || 0}</strong></p>
                <p>📝 Total tasks: <strong>${taskSummary.totalTasks || 0}</strong></p>
                <p>🏆 Points earned: <strong>${taskSummary.totalPoints || 0}</strong></p>
              ` : `
                <p>It's been ${hoursSinceActivity} hours since your last activity. Ready to get back on track?</p>
              `}
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2 style="font-size: 20px; margin: 0 0 15px 0;">💡 Today's Motivation</h2>
              <p style="font-style: italic;">"Small progress is still progress. Every task you complete helps me grow stronger! 🌱"</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Open Teyra Dashboard
              </a>
            </div>
            
            <div style="text-align: center; font-size: 14px; opacity: 0.7; margin-top: 30px;">
              <p>Keep growing with Mike! 🌵</p>
            </div>
          </div>
        `,
        text: `Hey ${firstName}! Mike the Cactus here with your daily check-in.\n\n${taskSummary ? `Your Progress:\n✅ Tasks completed: ${taskSummary.completedTasks || 0}\n📝 Total tasks: ${taskSummary.totalTasks || 0}\n🏆 Points earned: ${taskSummary.totalPoints || 0}` : `It's been ${hoursSinceActivity} hours since your last activity. Ready to get back on track?`}\n\nToday's Motivation: "Small progress is still progress. Every task you complete helps me grow stronger! 🌱"\n\nOpen your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nKeep growing with Mike! 🌵`
      };
      
    case 'daily_reset_trigger':
      return {
        subject: `🌅 Daily Reset Complete! Your 24-hour cycle with Mike`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 28px; margin: 0; font-weight: 800;">🌅 Daily Reset Complete!</h1>
              <p style="font-size: 16px; opacity: 0.9; margin: 10px 0;">Your 24-hour productivity cycle is done, ${firstName}</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2 style="font-size: 20px; margin: 0 0 15px 0;">🎉 What You Accomplished</h2>
              ${taskSummary ? `
                <p>✅ Tasks completed: <strong>${taskSummary.completedTasks || 0}</strong></p>
                <p>🏆 Points earned: <strong>${taskSummary.totalPoints || 0}</strong></p>
                <p>🌱 Mike's growth: <strong>${taskSummary.mikeState || 'Growing stronger'}</strong></p>
              ` : `
                <p>You've completed your daily cycle! Time for a fresh start.</p>
              `}
            </div>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2 style="font-size: 20px; margin: 0 0 15px 0;">🌟 Ready for Tomorrow?</h2>
              <p>Your tasks have been archived and you're ready for a new 24-hour productivity cycle. I'm excited to see what we'll accomplish together!</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Start New Cycle
              </a>
            </div>
          </div>
        `,
        text: `Daily Reset Complete! Your 24-hour productivity cycle is done, ${firstName}.\n\n${taskSummary ? `What You Accomplished:\n✅ Tasks completed: ${taskSummary.completedTasks || 0}\n🏆 Points earned: ${taskSummary.totalPoints || 0}\n🌱 Mike's growth: ${taskSummary.mikeState || 'Growing stronger'}` : 'You\'ve completed your daily cycle! Time for a fresh start.'}\n\nReady for Tomorrow? Your tasks have been archived and you're ready for a new 24-hour productivity cycle.\n\nStart your new cycle: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      };
      
    case 'first_task_reminder':
      return {
        subject: `🌱 ${firstName}, Mike is waiting for your first task!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); color: #2d3748; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 28px; margin: 0; font-weight: 800;">🌱 Welcome to Teyra!</h1>
              <p style="font-size: 16px; opacity: 0.8; margin: 10px 0;">Mike the Cactus is excited to grow with you</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.3); padding: 20px; border-radius: 12px; margin: 20px 0;">
              <h2 style="font-size: 20px; margin: 0 0 15px 0;">🎯 Ready to Start?</h2>
              <p>Hi ${firstName}! I'm Mike, your productivity companion. I'm currently a small, sad cactus, but with your help, I can grow into a happy, thriving plant!</p>
              <p>Add your first task to begin our 24-hour productivity journey together.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Add Your First Task
              </a>
            </div>
          </div>
        `,
        text: `Welcome to Teyra! Hi ${firstName}! I'm Mike, your productivity companion. Add your first task to begin our journey together.\n\nGet started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      };
      
    default:
      return {
        subject: `🌵 Mike here with your Teyra update!`,
        html: `<p>Hi ${firstName}! Mike the Cactus here. Check your dashboard for updates!</p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Open Dashboard</a>`,
        text: `Hi ${firstName}! Mike the Cactus here. Check your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      };
  }
}