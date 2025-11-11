import { NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get unique user count from user_progress table
    // Since user_id is UNIQUE, counting rows gives us distinct users
    const { count, error } = await supabase
      .from('user_progress')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching user count:', error);
      // Fallback: count distinct user_ids manually
      const { data: users, error: fallbackError } = await supabase
        .from('user_progress')
        .select('user_id');
      
      if (fallbackError) {
        console.error('Fallback count also failed:', fallbackError);
        return NextResponse.json({ count: 146 }, { status: 200 }); // Updated fallback number
      }
      
      const uniqueUsers = new Set(users?.map(u => u.user_id) || []);
      return NextResponse.json({ count: uniqueUsers.size || 146 });
    }

    return NextResponse.json({ count: count || 146 });
  } catch (error) {
    console.error('Error in user count API:', error);
    return NextResponse.json({ count: 146 }, { status: 200 }); // Updated fallback number
  }
}

