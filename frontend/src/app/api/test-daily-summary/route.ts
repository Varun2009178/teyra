import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing daily summary functionality...');
    
    // Test the daily reset endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/daily-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test_user_daily_summary'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Daily summary test successful:', result);
      
      return NextResponse.json({
        success: true,
        message: 'Daily summary functionality test completed successfully',
        result
      });
    } else {
      const error = await response.text();
      console.error('❌ Daily summary test failed:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Daily summary test failed',
        details: error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Daily summary test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 