import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Track user behavior event
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Enable behavior tracking
    // If tables don't exist, the error handling below will catch it

    const body = await request.json();
    const { 
      event_type, 
      event_data, 
      task_id, 
      mood, 
      completion_time, 
      time_of_day,
      device_type = 'unknown'
    } = body;

    // Valid event types
    const validEvents = [
      'task_created', 'task_completed', 'task_deleted', 'task_skipped',
      'mood_selected', 'session_start', 'session_end', 'notification_clicked',
      'daily_reset', 'milestone_achieved'
    ];

    if (!validEvents.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Store behavior event
    const { data, error } = await supabase
      .from('user_behavior_events')
      .insert({
        user_id: user.id,
        event_type,
        event_data: event_data || {},
        task_id,
        mood,
        completion_time: completion_time ? new Date(completion_time).toISOString() : null,
        time_of_day: time_of_day || new Date().getHours(),
        device_type,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing behavior event:', error);
      
      // Check if it's a table missing error
      if (error.message.includes('relation "user_behavior_events" does not exist')) {
        console.warn('⚠️ Behavior tracking tables not set up. Please run: npx tsx scripts/setup-ai-system.ts');
        return NextResponse.json({ 
          error: 'Behavior tracking not configured', 
          setupRequired: true 
        }, { status: 503 });
      }
      
      return NextResponse.json({ error: 'Failed to store behavior event' }, { status: 500 });
    }

    // Update user behavior analysis after storing event
    await updateUserBehaviorAnalysis(user.id);

    return NextResponse.json({ 
      message: 'Behavior event tracked successfully',
      event: data
    });

  } catch (error) {
    console.error('Error tracking behavior:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get user behavior analysis
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get behavior analysis
    const { data: analysis, error } = await supabase
      .from('user_behavior_analysis')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching behavior analysis:', error);
      return NextResponse.json({ error: 'Failed to fetch behavior analysis' }, { status: 500 });
    }

    // If no analysis exists, create initial one
    if (!analysis) {
      const initialAnalysis = await createInitialBehaviorAnalysis(user.id);
      return NextResponse.json({ analysis: initialAnalysis });
    }

    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('Error fetching behavior analysis:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function createInitialBehaviorAnalysis(userId: string) {
  const initialAnalysis = {
    user_id: userId,
    task_completion_rate: 0,
    avg_completion_time: null,
    preferred_task_times: [],
    common_moods: [],
    productive_hours: [],
    notification_responsiveness: 0,
    task_patterns: {},
    last_analyzed: new Date().toISOString(),
    behavioral_insights: [
      "Just started - AI is learning your patterns",
      "Complete a few tasks to unlock personalized insights"
    ]
  };

  const { data, error } = await supabase
    .from('user_behavior_analysis')
    .upsert(initialAnalysis, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating initial behavior analysis:', error);
    
    // If duplicate, try to fetch existing
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('user_behavior_analysis')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      return existing || initialAnalysis;
    }
    
    return initialAnalysis;
  }

  return data;
}

async function updateUserBehaviorAnalysis(userId: string) {
  try {
    // Get all behavior events for analysis
    const { data: events, error: eventsError } = await supabase
      .from('user_behavior_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000); // Analyze last 1000 events

    if (eventsError) {
      console.error('Error fetching events for analysis:', eventsError);
      return;
    }

    if (!events || events.length === 0) {
      return;
    }

    // Analyze behavior patterns
    const analysis = analyzeUserBehavior(events);
    
    // Update or create behavior analysis - handle duplicates properly
    const { error: upsertError } = await supabase
      .from('user_behavior_analysis')
      .upsert({
        user_id: userId,
        ...analysis,
        last_analyzed: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error updating behavior analysis:', upsertError);
      
      // If still a duplicate key error, try update instead
      if (upsertError.code === '23505') {
        console.log('Trying update instead of upsert for user:', userId);
        const { error: updateError } = await supabase
          .from('user_behavior_analysis')
          .update({
            ...analysis,
            last_analyzed: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Error with update fallback:', updateError);
        }
      }
    }

  } catch (error) {
    console.error('Error in updateUserBehaviorAnalysis:', error);
  }
}

function analyzeUserBehavior(events: any[]) {
  const completionEvents = events.filter(e => e.event_type === 'task_completed');
  const creationEvents = events.filter(e => e.event_type === 'task_created');
  const moodEvents = events.filter(e => e.event_type === 'mood_selected');
  const notificationEvents = events.filter(e => e.event_type === 'notification_clicked');

  // Calculate completion rate
  const completionRate = creationEvents.length > 0 
    ? (completionEvents.length / creationEvents.length) * 100 
    : 0;

  // Find productive hours (when most tasks are completed)
  const completionHours = completionEvents.map(e => e.time_of_day || new Date(e.created_at).getHours());
  const hourCounts = completionHours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const productiveHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Analyze common moods
  const moodCounts = moodEvents.reduce((acc, event) => {
    if (event.mood) {
      acc[event.mood] = (acc[event.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const commonMoods = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([mood]) => mood);

  // Calculate notification responsiveness
  const notificationResponsiveness = events.length > 0 
    ? (notificationEvents.length / events.length) * 100 
    : 0;

  // Generate behavioral insights
  const insights = generateBehavioralInsights({
    completionRate,
    productiveHours,
    commonMoods,
    notificationResponsiveness,
    totalEvents: events.length
  });

  return {
    task_completion_rate: Math.round(completionRate),
    productive_hours: productiveHours,
    common_moods: commonMoods,
    notification_responsiveness: Math.round(notificationResponsiveness),
    behavioral_insights: insights,
    task_patterns: {
      avg_tasks_per_day: Math.round(creationEvents.length / Math.max(1, getDaysActive(events))),
      completion_streak: calculateCompletionStreak(events),
      preferred_task_types: analyzeTaskTypes(events)
    }
  };
}

function generateBehavioralInsights(data: any) {
  const insights = [];

  if (data.completionRate >= 80) {
    insights.push("🔥 High performer - you complete most of your tasks!");
  } else if (data.completionRate >= 60) {
    insights.push("📈 Good progress - you're completing more than half your tasks");
  } else if (data.completionRate >= 40) {
    insights.push("⚡ Room for improvement - try smaller, more achievable tasks");
  } else {
    insights.push("🎯 Let's focus on completing just 1-2 tasks to build momentum");
  }

  if (data.productiveHours.length > 0) {
    const bestHour = data.productiveHours[0];
    const timeStr = bestHour < 12 ? `${bestHour}AM` : `${bestHour - 12 || 12}PM`;
    insights.push(`⏰ Most productive around ${timeStr} - schedule important tasks then!`);
  }

  if (data.notificationResponsiveness > 60) {
    insights.push("📱 Great at responding to notifications - we'll send you helpful reminders");
  } else if (data.notificationResponsiveness < 20) {
    insights.push("🔕 Prefers fewer notifications - we'll only send the most important ones");
  }

  if (data.totalEvents < 10) {
    insights.push("🌱 Just getting started - AI is learning your patterns");
  } else if (data.totalEvents > 100) {
    insights.push("🧠 AI has learned your patterns well - expect smart suggestions!");
  }

  return insights;
}

function getDaysActive(events: any[]) {
  if (events.length === 0) return 1;
  
  const dates = events.map(e => new Date(e.created_at).toDateString());
  const uniqueDates = new Set(dates);
  return uniqueDates.size;
}

function calculateCompletionStreak(events: any[]) {
  // This would calculate current completion streak
  // For now, return a simple calculation
  const recentCompletions = events
    .filter(e => e.event_type === 'task_completed')
    .slice(0, 10);
  
  return recentCompletions.length;
}

function analyzeTaskTypes(events: any[]) {
  // Analyze what types of tasks user prefers
  const taskEvents = events.filter(e => e.event_type === 'task_created' && e.event_data?.title);
  
  // Simple categorization based on keywords
  const categories = {
    work: ['work', 'meeting', 'email', 'call', 'project'],
    health: ['workout', 'exercise', 'walk', 'gym', 'health'],
    personal: ['clean', 'shop', 'buy', 'cook', 'home'],
    learning: ['read', 'study', 'learn', 'course', 'book']
  };

  const typeCounts = Object.keys(categories).reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as Record<string, number>);

  taskEvents.forEach(event => {
    const title = (event.event_data?.title || '').toLowerCase();
    Object.entries(categories).forEach(([type, keywords]) => {
      if (keywords.some(keyword => title.includes(keyword))) {
        typeCounts[type]++;
      }
    });
  });

  return typeCounts;
}