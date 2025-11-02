// API Route: AI-Powered Smart Scheduling
import { NextRequest, NextResponse } from 'next/server';
import { serviceSupabase as supabase } from '@/lib/supabase-service';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's timezone from request body
    const body = await request.json().catch(() => ({}));
    const userTimezone = body.timezone || 'America/New_York'; // Default to EST if not provided
    console.log('🌍 User timezone received:', userTimezone);

    // Using shared singleton

    // Get all unscheduled tasks
    const { data: unscheduledTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .is('scheduled_time', null)
      .eq('completed', false);

    console.log('📋 Unscheduled tasks query result:', {
      count: unscheduledTasks?.length || 0,
      tasks: unscheduledTasks,
      error: tasksError
    });

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError);
      throw new Error('Failed to fetch tasks');
    }

    if (!unscheduledTasks || unscheduledTasks.length === 0) {
      console.log('⚠️ No unscheduled tasks found');
      return NextResponse.json({
        message: 'No unscheduled tasks to schedule',
        scheduledCount: 0
      });
    }

    console.log(`✅ Found ${unscheduledTasks.length} unscheduled tasks to schedule`);

    // Check pro status and AI schedule usage
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('is_pro, ai_schedule_uses, google_calendar_token, current_mood')
      .eq('user_id', userId)
      .single();

    const isPro = userProgress?.is_pro || false;
    const aiScheduleUses = userProgress?.ai_schedule_uses || 0;
    const FREE_LIMIT = 3;

    console.log(`👤 User pro status: ${isPro}, AI schedule uses: ${aiScheduleUses}/${FREE_LIMIT}`);

    // Check if user has exceeded free limit
    if (!isPro && aiScheduleUses >= FREE_LIMIT) {
      console.log('🚫 User has exceeded free AI schedule limit');
      return NextResponse.json({
        error: 'upgrade_required',
        message: `You've used all ${FREE_LIMIT} free AI scheduling sessions. Upgrade to Pro for more productivity features!`,
        usesRemaining: 0,
        isPro: false
      }, { status: 403 });
    }

    // Get existing scheduled tasks to avoid conflicts
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: existingScheduledTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .not('scheduled_time', 'is', null)
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', weekFromNow.toISOString());

    // Get user's Google Calendar events for the next week
    let googleEvents: any[] = [];

    if (userProgress?.google_calendar_token) {
      try {
        const calendarResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${weekFromNow.toISOString()}&singleEvents=true`,
          {
            headers: {
              Authorization: `Bearer ${userProgress.google_calendar_token.access_token}`,
            },
          }
        );

        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          googleEvents = calendarData.items || [];
        }
      } catch (error) {
        console.log('Could not fetch Google Calendar events, continuing without them');
      }
    }

    // Get user's task completion history for pattern analysis
    const { data: completedTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', true)
      .not('scheduled_time', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    // Analyze completion patterns by hour
    const completionsByHour: Record<number, number> = {};
    if (completedTasks) {
      completedTasks.forEach(task => {
        if (task.scheduled_time) {
          const hour = new Date(task.scheduled_time).getHours();
          completionsByHour[hour] = (completionsByHour[hour] || 0) + 1;
        }
      });
    }

    // Prepare data for AI
    const aiPrompt = `You are a smart scheduling assistant. Analyze the user's data and schedule their tasks optimally.

USER DATA:
- User timezone: ${userTimezone}
- Current time: ${now.toISOString()} (${now.toLocaleString('en-US', { timeZone: userTimezone, dateStyle: 'full', timeStyle: 'short' })})
- Current mood: ${userProgress?.current_mood || 'neutral'}
- Tasks to schedule:
${unscheduledTasks.map(t => `  • Task ID ${t.id}: "${t.title}" (${t.duration_minutes || 60} minutes)`).join('\n')}
- Historical productivity by hour: ${Object.entries(completionsByHour).map(([hour, count]) => `${hour}:00 (${count} tasks completed)`).join(', ') || 'No historical data'}

CONSTRAINTS:
- IMPORTANT: User is in ${userTimezone} timezone. When they say "7 pm", they mean 7 PM in ${userTimezone}.
- Current time in user's timezone: ${now.toISOString()}
- Schedule within the next 7 days
- Working hours: 8 AM - 10 PM
- Avoid scheduling in the past
- Each task needs ${unscheduledTasks[0]?.duration_minutes || 60} minutes by default
- Existing busy times: ${[...existingScheduledTasks || [], ...googleEvents].map(e => {
  const start = e.scheduled_time || e.start?.dateTime;
  const duration = e.duration_minutes || 60;
  return start ? `${new Date(start).toLocaleString()} (${duration}min)` : '';
}).filter(Boolean).join(', ') || 'None'}

⚠️ CRITICAL SCHEDULING RULES - READ TASK TITLES WORD BY WORD:

1. PARSE TIMES FROM TASK TITLES:
   Look for keywords: "at", "by", "pm", "am", "tonight", "tomorrow"

2. "AT X TIME" = SCHEDULE EXACTLY AT THAT TIME:
   - "go to movies at 6 pm" → schedule at 18:00 (6 PM) EXACTLY
   - "call mom at 9 am" → schedule at 09:00 (9 AM) EXACTLY
   - "meeting at 2:30 pm" → schedule at 14:30 (2:30 PM) EXACTLY

3. "BY X TIME" = SCHEDULE BEFORE THAT TIME (WITH BUFFER):
   - "homework by 11:59 pm" → schedule at 22:00 (10 PM) to finish before deadline
   - "report by 5 pm" → schedule at 14:00 (2 PM) to complete before 5 PM

4. RELATIVE TIME KEYWORDS:
   - "tonight" → schedule today between 18:00-21:00
   - "tomorrow morning" → schedule tomorrow 08:00-11:00
   - "this weekend" → schedule Saturday or Sunday
   - "urgent" or "ASAP" → schedule within next 2 hours
2. Schedule tasks during historically productive hours when possible
3. Consider the user's current mood:
   - If happy/good: can handle more challenging tasks
   - If tired/stressed: schedule lighter/shorter tasks
   - If sad: start with easy wins
4. Prefer morning (8-11 AM) for deep work, afternoon (2-5 PM) for lighter tasks
5. Leave breathing room between tasks (at least 30 min gaps)
6. If a task mentions a deadline, schedule it with buffer time BEFORE the deadline

IMPORTANT: You MUST use the exact task IDs provided above. Do not make up task IDs.

Respond with a JSON array where EACH task gets ONE scheduled time. Format:
[
  {
    "taskId": <exact_task_id_from_above>,
    "scheduledTime": "<ISO_timestamp>",
    "durationMinutes": <number>,
    "reason": "brief reason"
  }
]

EXAMPLE - STUDY THIS CAREFULLY:

Current time: 2025-10-24T15:00:00.000Z (3 PM)

Tasks to schedule:
- Task ID 45: "go to movies with friends at 6 pm today" (90 minutes)
- Task ID 67: "finish homework by 11:59 pm tonight" (60 minutes)
- Task ID 89: "workout tomorrow morning" (30 minutes)

CORRECT scheduling response:
[
  {
    "taskId": 45,
    "scheduledTime": "2025-10-24T18:00:00.000Z",
    "durationMinutes": 90,
    "reason": "Task says 'at 6 pm' so scheduled exactly at 18:00"
  },
  {
    "taskId": 67,
    "scheduledTime": "2025-10-24T22:00:00.000Z",
    "durationMinutes": 60,
    "reason": "Task says 'by 11:59 pm' so scheduled at 22:00 to finish before deadline"
  },
  {
    "taskId": 89,
    "scheduledTime": "2025-10-25T09:00:00.000Z",
    "durationMinutes": 30,
    "reason": "Task says 'tomorrow morning' so scheduled at 9 AM tomorrow"
  }
]

Return ONLY valid JSON array. No markdown, no explanations.`;

    console.log('🤖 Sending scheduling request to AI...');
    console.log('📝 AI Prompt:', aiPrompt.substring(0, 500) + '...');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a smart scheduling assistant. Always respond with valid JSON only, no markdown or explanations. CAREFULLY READ task titles for specific times like "at 6pm" or "by 11:59pm" and schedule accordingly.'
        },
        {
          role: 'user',
          content: aiPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    console.log('🤖 AI Response:', aiResponse);

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    let scheduleRecommendations;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      scheduleRecommendations = JSON.parse(cleanedResponse);
      console.log('✅ Parsed recommendations:', scheduleRecommendations);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Apply the schedule recommendations
    const scheduledTasks = [];
    console.log(`📝 Processing ${scheduleRecommendations.length} recommendations...`);

    for (const recommendation of scheduleRecommendations) {
      console.log(`🔍 Looking for task with ID ${recommendation.taskId} (type: ${typeof recommendation.taskId})...`);

      // Handle both string and number IDs
      const task = unscheduledTasks.find(t =>
        t.id == recommendation.taskId || // Loose equality to handle string/number mismatch
        t.id === recommendation.taskId ||
        String(t.id) === String(recommendation.taskId)
      );

      if (!task) {
        console.warn(`⚠️ Task ${recommendation.taskId} not found in unscheduled tasks.`);
        console.warn(`Available task IDs:`, unscheduledTasks.map(t => `${t.id} (${typeof t.id})`));
        console.warn(`Available tasks:`, unscheduledTasks.map(t => ({ id: t.id, title: t.title })));
        continue;
      }
      console.log(`✅ Found task: "${task.title}" (ID: ${task.id})`);

      const scheduledTime = new Date(recommendation.scheduledTime);

      // Validate: don't schedule in the past
      if (scheduledTime < now) {
        console.warn(`Skipping task ${task.id} - scheduled time is in the past`);
        continue;
      }

      // Update task with schedule
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update({
          scheduled_time: recommendation.scheduledTime,
          duration_minutes: recommendation.durationMinutes || 60,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error) {
        console.error(`Error scheduling task ${task.id}:`, error);
        continue;
      }

      scheduledTasks.push({
        ...updatedTask,
        reason: recommendation.reason
      });

      // Sync to Google Calendar if connected
      if (userProgress?.google_calendar_token) {
        try {
          await fetch(`${request.nextUrl.origin}/api/calendar/sync-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: task.id,
              action: 'create'
            })
          });
        } catch (syncError) {
          console.log(`Could not sync task ${task.id} to Google Calendar`);
        }
      }
    }

    console.log(`✅ Successfully scheduled ${scheduledTasks.length} tasks`);

    // Increment AI schedule usage counter (only for non-pro users)
    let newUsageCount = aiScheduleUses;
    if (!isPro) {
      newUsageCount = aiScheduleUses + 1;
      console.log(`📊 Attempting to update AI schedule uses from ${aiScheduleUses} to ${newUsageCount}`);

      const { data: updateResult, error: updateError } = await supabase
        .from('user_progress')
        .update({ ai_schedule_uses: newUsageCount })
        .eq('user_id', userId)
        .select();

      if (updateError) {
        console.error('❌ Error updating ai_schedule_uses:', updateError);
      } else {
        console.log(`✅ Successfully updated AI schedule uses to ${newUsageCount}. Result:`, updateResult);
      }
    }

    const usesRemaining = isPro ? 999 : Math.max(0, FREE_LIMIT - newUsageCount);
    console.log(`📊 Calculated usesRemaining: ${usesRemaining} (isPro: ${isPro}, newUsageCount: ${newUsageCount}, FREE_LIMIT: ${FREE_LIMIT})`);

    return NextResponse.json({
      success: true,
      scheduledCount: scheduledTasks.length,
      tasks: scheduledTasks,
      message: `Successfully scheduled ${scheduledTasks.length} task${scheduledTasks.length !== 1 ? 's' : ''}`,
      usesRemaining,
      isPro
    });

  } catch (error: any) {
    console.error('Error in auto-schedule:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to auto-schedule tasks',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
