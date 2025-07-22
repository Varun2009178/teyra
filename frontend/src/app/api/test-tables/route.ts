import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing table access...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEW_SUPABASE_SERVICE_KEY!
    );
    
    // Try to get table list using a different approach
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    console.log('Tables test:', { data: tables, error: tablesError });
    
    // Try a simple query to see if we can connect at all
    const { data: testData, error: testError } = await supabase
      .from('user_stats')
      .select('count')
      .limit(1);
    
    console.log('Simple query test:', { data: testData, error: testError });
    
    // Try to get the current user/role
    const { data: roleData, error: roleError } = await supabase
      .rpc('current_user');
    
    console.log('Current user test:', { data: roleData, error: roleError });
    
    return NextResponse.json({
      success: true,
      tables: { data: tables, error: tablesError },
      test: { data: testData, error: testError },
      role: { data: roleData, error: roleError }
    });
    
  } catch (error) {
    console.error('Table test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 