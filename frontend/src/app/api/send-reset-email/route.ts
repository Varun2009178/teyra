import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

// Using shared singleton

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskSummary, userStats } = body;

    // Get user's email
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    const userName = user.firstName || 'there';
    
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found for user' }, { status: 400 });
    }

    // Create email content
    const emailSubject = "🌅 Your tasks have been reset - Start your new day!";
    
    // Generate AI insights based on completion patterns
    const completionRate = taskSummary.total > 0 ? Math.round((taskSummary.completed_count / taskSummary.total) * 100) : 0;
    let aiInsight = "";
    
    if (completionRate >= 80) {
      aiInsight = "🤖 AI Notice: You're crushing it! I'm thinking bigger challenges and efficiency optimizations for today.";
    } else if (completionRate >= 50) {
      aiInsight = "🤖 AI Notice: Solid progress! I'm analyzing what worked and planning better task sizing for today.";
    } else if (completionRate >= 20) {
      aiInsight = "🤖 AI Notice: I see the struggle. Planning smaller, more achievable wins to build momentum today.";
    } else {
      aiInsight = "🤖 AI Notice: Fresh start time! I'm focusing on gentle, energizing tasks to rebuild your rhythm.";
    }

    const emailBody = `
Hey ${userName}!

Your tasks have been reset - start your new day today! 🚀

${aiInsight}

Ready to lock in? Let's make today count! 💪

[Open Teyra Dashboard](${process.env.NEXT_PUBLIC_APP_URL}/dashboard)

Keep growing! 🌱
The Teyra Team
    `;

    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll log the email content and store it for the user to see
    
    console.log('📧 Reset email would be sent to:', userEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailBody);

    // Store the email in a notifications table or send via your email service
    // This is a placeholder - implement your actual email service here
    const emailSent = await sendEmail(userEmail, emailSubject, emailBody, aiInsight);
    
    if (emailSent) {
      // Log email sent in user progress
      await supabase
        .from('user_progress')
        .update({
          last_reset_email_sent: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      return NextResponse.json({ 
        message: 'Reset email sent successfully',
        email: userEmail 
      });
    } else {
      // If email failed to send (likely due to missing API key), still return success
      // but log that email was skipped
      console.log(`📧 Email sending skipped for ${userEmail} (likely missing RESEND_API_KEY)`);
      
      return NextResponse.json({ 
        message: 'Reset completed successfully (email skipped - check RESEND_API_KEY configuration)',
        email: userEmail,
        emailSkipped: true
      });
    }

  } catch (error) {
    console.error('Error sending reset email:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Resend email integration
async function sendEmail(to: string, subject: string, body: string, aiInsight: string): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not found, skipping email send. To enable emails, add RESEND_API_KEY to your environment variables.');
      return false;
    }

    console.log(`📧 Sending reset email to ${to}`);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Teyra <noreply@resend.dev>',
        to: [to],
        subject: subject,
        text: body,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">🌅 Your tasks have been reset!</h1>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
              <p style="margin: 10px 0; line-height: 1.5; font-size: 18px;">Start your new day today! 🚀</p>
              <p style="margin: 15px 0; line-height: 1.5; color: #6b7280; font-style: italic;">${aiInsight}</p>
              <p style="margin: 10px 0; line-height: 1.5; font-weight: bold;">Ready to lock in? Let's make today count! 💪</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background: linear-gradient(45deg, #3b82f6, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Open Teyra Dashboard 🚀
              </a>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
              <p>Keep growing! 🌱<br>The Teyra Team</p>
            </div>
          </div>
        `
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email sent successfully:', result.id);
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Failed to send email:', error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return false;
  }
}