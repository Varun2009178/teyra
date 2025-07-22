import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Anon Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Test basic connection
    const { data, error } = await supabase
      .from('user_stats')
      .select('count')
      .limit(1);
    
    console.log('Connection test result:', { data, error });
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      data: data
    });
    
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 