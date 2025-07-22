import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Setting up database...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEW_SUPABASE_SERVICE_KEY! // Use service key for admin operations
    );
    
    // Try to create user_stats table
    const { error: statsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_stats (
          id SERIAL PRIMARY KEY,
          userId TEXT UNIQUE NOT NULL,
          all_time_completed INTEGER DEFAULT 0,
          current_streak INTEGER DEFAULT 0,
          completed_today INTEGER DEFAULT 0,
          user_mood TEXT DEFAULT 'neutral',
          ai_splits_today INTEGER DEFAULT 0,
          daily_limit INTEGER DEFAULT 10,
          timezone TEXT DEFAULT 'UTC',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    // Try to create tasks table
    const { error: tasksError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          userId TEXT NOT NULL,
          title TEXT NOT NULL,
          completed BOOLEAN DEFAULT FALSE,
          has_been_split BOOLEAN DEFAULT FALSE,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    // Grant permissions
    const { error: permError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_stats DISABLE ROW LEVEL SECURITY;
        ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
        GRANT USAGE ON SCHEMA public TO anon;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
      `
    });
    
    console.log('Setup errors:', { statsError, tasksError, permError });
    
    return NextResponse.json({
      success: true,
      errors: {
        statsError: statsError?.message,
        tasksError: tasksError?.message,
        permError: permError?.message
      }
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 