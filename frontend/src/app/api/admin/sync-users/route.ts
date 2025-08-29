import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting user sync check...');
    
    // For now, let's just check what users exist in Supabase
    // and show you the current status
    
    const { data: supabaseUsers, error: countError } = await supabase
      .from('user_progress')
      .select('user_id, created_at');
    
    if (countError) {
      console.error('❌ Error counting Supabase users:', countError);
      return NextResponse.json({ 
        error: 'Failed to count users',
        details: countError.message
      }, { status: 500 });
    }
    
    console.log(`📊 Current users in Supabase: ${supabaseUsers?.length || 0}`);
    
    // Check if user_ai_patterns table exists and has users
    let aiPatternsCount = 0;
    try {
      const { data: aiUsers, error: aiError } = await supabase
        .from('user_ai_patterns')
        .select('user_id');
      
      if (!aiError) {
        aiPatternsCount = aiUsers?.length || 0;
      }
    } catch (e) {
      console.log('⚠️ user_ai_patterns table might not exist');
    }
    
    // Check if user_behavior table exists and has users
    let behaviorCount = 0;
    try {
      const { data: behaviorUsers, error: behaviorError } = await supabase
        .from('user_behavior')
        .select('user_id');
      
      if (!behaviorError) {
        behaviorCount = behaviorUsers?.length || 0;
      }
    } catch (e) {
      console.log('⚠️ user_behavior table might not exist');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database status check completed',
      stats: {
        userProgressCount: supabaseUsers?.length || 0,
        aiPatternsCount,
        behaviorCount,
        timestamp: new Date().toISOString()
      },
      note: 'To sync users from Clerk, you need to run this from a server environment with proper Clerk access'
    });
    
  } catch (error) {
    console.error('❌ Fatal error during check:', error);
    return NextResponse.json({ 
      error: 'Failed to check database status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
