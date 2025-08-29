import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test webhook called');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    const body = await request.json();
    console.log('Body:', JSON.stringify(body, null, 2));
    
    return NextResponse.json({ 
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      body 
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ 
      error: 'Test webhook failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString(),
    environment: {
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
}