import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Initialize Resend lazily to avoid build-time errors
let resend: Resend | null = null;

function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email queue processing - TODO: Update for Supabase');

    const resendClient = getResend();
    if (!resendClient) {
      console.error('❌ RESEND_API_KEY not configured');
      return NextResponse.json({ 
        error: 'Email service not configured' 
      }, { status: 500 });
    }

    // TODO: Implement email queue with Supabase
    console.log('📧 Email queue system needs to be rebuilt for Supabase');

    return NextResponse.json({
      success: true,
      message: 'Email queue processing - TODO: Update for Supabase',
      stats: {
        processed: 0,
        successful: 0,
        failed: 0
      }
    });

  } catch (error) {
    console.error('❌ Email queue processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}