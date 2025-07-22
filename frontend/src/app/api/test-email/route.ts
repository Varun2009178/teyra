import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing email system...');
    
    // Test the email sending
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        type: 'daily_checkin',
        timezone: 'UTC',
        hoursSinceActivity: 48,
        userData: {
          tasks_completed: 5,
          current_streak: 0,
          longest_streak: 0
        }
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email test successful:', result);
      
      return NextResponse.json({
        success: true,
        message: 'Email test completed successfully',
        result
      });
    } else {
      const error = await response.text();
      console.error('❌ Email test failed:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Email sending failed',
        details: error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Email test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 