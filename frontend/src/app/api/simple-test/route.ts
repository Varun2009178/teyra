import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Simple test starting...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log('Supabase client created');
    
    // Try the simplest possible query
    const { data, error } = await supabase
      .from('user_stats')
      .select('userId')
      .limit(1);
    
    console.log('Query result:', { data, error });
    
    if (error) {
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 