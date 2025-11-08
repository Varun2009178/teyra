import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ tasks: [] });
    }

    // Search using Supabase
    const { data: matchingTasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,tags.cs.["${query}"]`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ tasks: matchingTasks || [] });
  } catch (error) {
    console.error('error searching tasks:', error);
    return NextResponse.json(
      { error: 'failed to search tasks' },
      { status: 500 }
    );
  }
}
