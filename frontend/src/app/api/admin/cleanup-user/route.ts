import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Initialize Supabase with service role key for admin operations
// Using shared singleton

export async function POST(request: NextRequest) {
  try {
    // This is an admin endpoint - in production you'd want proper admin authentication
    // For now, we'll use a simple API key check
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log(`🧹 Manual cleanup: Starting deletion process for user: ${userId}`);
    
    // First, check what data exists for this user before deletion
    console.log(`🔍 Checking existing data for user ${userId}...`);
    
    const checkPromises = [
      supabase.from('tasks').select('id').eq('user_id', userId),
      supabase.from('user_progress').select('id').eq('user_id', userId),
      supabase.from('user_behavior_events').select('id').eq('user_id', userId),
      supabase.from('user_behavior_analysis').select('id').eq('user_id', userId)
    ];
    
    const checkResults = await Promise.allSettled(checkPromises);
    const tableNames = ['tasks', 'user_progress', 'user_behavior_events', 'user_behavior_analysis'];
    
    const existingData: Record<string, number> = {};
    
    checkResults.forEach((result, index) => {
      const tableName = tableNames[index];
      if (result.status === 'fulfilled' && result.value.data) {
        existingData[tableName] = result.value.data.length;
        console.log(`📋 Found ${result.value.data.length} records in ${tableName} for user ${userId}`);
      } else {
        existingData[tableName] = 0;
        console.log(`⚠️  Could not check ${tableName} for user ${userId}:`, result.status === 'rejected' ? result.reason : 'No data');
      }
    });
    
    // Define all user-related tables
    const userTables = [
      'tasks', 
      'user_progress', 
      'user_behavior_events', 
      'user_behavior_analysis'
    ];
    
    // Delete from all user-related tables sequentially for better error tracking
    const deletionResults = [];
    
    for (const table of userTables) {
      try {
        console.log(`🗑️  Deleting from ${table} for user ${userId}...`);
        
        const deleteResult = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
        
        if (deleteResult.error) {
          console.error(`❌ Error deleting from ${table}:`, deleteResult.error);
          deletionResults.push({ table, success: false, error: deleteResult.error.message });
        } else {
          console.log(`✅ Successfully deleted from ${table} for user ${userId} (count: ${deleteResult.count || 'unknown'})`);
          deletionResults.push({ table, success: true, count: deleteResult.count || 0 });
        }
      } catch (error) {
        console.error(`❌ Exception while deleting from ${table}:`, error);
        deletionResults.push({ table, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    // Summary of deletion results
    const successfulDeletions = deletionResults.filter(r => r.success).length;
    const failedDeletions = deletionResults.filter(r => !r.success);
    
    console.log(`📊 Deletion summary for user ${userId}:`);
    console.log(`   ✅ Successful: ${successfulDeletions}/${userTables.length} tables`);
    if (failedDeletions.length > 0) {
      console.log(`   ❌ Failed: ${failedDeletions.length} tables`);
      failedDeletions.forEach(failure => {
        console.log(`      - ${failure.table}: ${failure.error}`);
      });
    }
    
    return NextResponse.json({
      message: `User cleanup completed`,
      userId,
      existingData,
      deletionResults,
      summary: {
        successful: successfulDeletions,
        failed: failedDeletions.length,
        total: userTables.length
      }
    });
    
  } catch (error) {
    console.error(`❌ Manual cleanup: Critical error:`, error);
    return NextResponse.json({ 
      error: `Manual cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// GET endpoint to check user data without deleting
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    console.log(`🔍 Checking data for user: ${userId}`);
    
    const checkPromises = [
      supabase.from('tasks').select('id, title, completed, created_at').eq('user_id', userId),
      supabase.from('user_progress').select('*').eq('user_id', userId),
      supabase.from('user_behavior_events').select('id, event_type, created_at').eq('user_id', userId),
      supabase.from('user_behavior_analysis').select('id, analysis_type, created_at').eq('user_id', userId)
    ];
    
    const checkResults = await Promise.allSettled(checkPromises);
    const tableNames = ['tasks', 'user_progress', 'user_behavior_events', 'user_behavior_analysis'];
    
    const userData: Record<string, any> = {};
    
    checkResults.forEach((result, index) => {
      const tableName = tableNames[index];
      if (result.status === 'fulfilled') {
        userData[tableName] = {
          count: result.value.data?.length || 0,
          data: result.value.data || [],
          error: result.value.error?.message || null
        };
      } else {
        userData[tableName] = {
          count: 0,
          data: [],
          error: result.reason
        };
      }
    });
    
    return NextResponse.json({
      userId,
      userData,
      summary: {
        totalRecords: Object.values(userData).reduce((sum: number, table: any) => sum + table.count, 0),
        tablesWithData: Object.entries(userData).filter(([_, table]: [string, any]) => table.count > 0).length
      }
    });
    
  } catch (error) {
    console.error(`❌ User data check error:`, error);
    return NextResponse.json({ 
      error: `Failed to check user data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}