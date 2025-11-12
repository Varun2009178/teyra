import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Gen Z notification messages (all lowercase, with appropriate curse words)
const GENZ_NOTIFICATIONS = [
  "bro can you lock in you have so much stuff to do",
  "bro can you lock the hell in holy shit",
  "yo you're procrastinating again 💀 get back to work",
  "bro stop scrolling and do your tasks fr",
  "you have tasks waiting... are we being fr right now?",
  "lock in bro your tasks aren't gonna do themselves",
  "stop the scroll and get back to productivity mode",
  "bro you're on social media again... your tasks are crying",
  "can you actually focus rn? you got stuff to do",
  "yo get off that app and check your tasks 💯",
  "bro what the hell are you doing? you got tasks",
  "dude stop wasting time and get your shit done",
  "bro you're slacking hard rn... lock in",
  "yo your tasks are piling up and you're doing nothing",
  "bro get your ass back to work fr",
  "dude what are you even doing? check your tasks",
  "bro stop being lazy and get back to productivity",
  "yo you're slacking so hard right now 💀",
  "bro your tasks are waiting and you're doing nothing",
  "dude get off your phone and do your tasks",
  "bro you're procrastinating so hard rn",
  "yo stop wasting time and lock in",
  "bro what the hell? you got so much to do",
  "dude your tasks aren't gonna complete themselves",
  "bro get back to work you're slacking",
  "im waiting for you big boy",
  "DO YOUR WORK"
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's incomplete tasks
    const tasksResponse = await fetch(`${request.nextUrl.origin}/api/tasks`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!tasksResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const tasks = await tasksResponse.json();
    const incompleteTasks = tasks.filter((t: any) => !t.completed && !t.title.includes('[COMPLETED]'));

    // Only send notification if there are MORE than 5 incomplete tasks
    if (incompleteTasks.length <= 5) {
      return NextResponse.json({ 
        message: `Only ${incompleteTasks.length} tasks (need >5)`, 
        taskCount: incompleteTasks.length 
      }, { status: 200 });
    }

    // Use provided message or random Gen Z message
    const notificationMessage = message || GENZ_NOTIFICATIONS[Math.floor(Math.random() * GENZ_NOTIFICATIONS.length)];

    // Return the notification data - the service worker will handle showing it
    return NextResponse.json({
      success: true,
      message: notificationMessage,
      taskCount: incompleteTasks.length
    });
  } catch (error) {
    console.error('Error triggering notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

