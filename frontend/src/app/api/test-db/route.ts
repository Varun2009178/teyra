import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProgress, tasks } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test 1: Try to select from user_progress
    const progressData = await db
      .select()
      .from(userProgress)
      .limit(1);
    
    console.log('Progress data found:', progressData.length);
    
    // Test 2: Try to select from tasks
    const tasksData = await db
      .select()
      .from(tasks)
      .limit(1);
    
    console.log('Tasks data found:', tasksData.length);
    
    return NextResponse.json({
      success: true,
      progress: { data: progressData, count: progressData.length },
      tasks: { data: tasksData, count: tasksData.length }
    });
    
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 