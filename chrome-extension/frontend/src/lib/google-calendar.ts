// Google Calendar API utilities
import { google } from 'googleapis';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  status?: string;
}

export interface TeyraTask {
  id: string;
  title: string;
  scheduled_time?: string;
  duration_minutes?: number;
  google_event_id?: string;
  completed?: boolean;
}

// Create OAuth2 client
export function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  return oauth2Client;
}

// Get authorization URL
export function getAuthUrl(userId?: string) {
  const oauth2Client = getOAuth2Client();

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: userId ? Buffer.from(JSON.stringify({ userId })).toString('base64') : undefined
  });
}

// Exchange code for tokens
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Create calendar client with user tokens
export function getCalendarClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Fetch user's calendar events
export async function fetchCalendarEvents(
  accessToken: string,
  refreshToken: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100
  });

  return (response.data.items || []) as CalendarEvent[];
}

// Create a calendar event from a Teyra task
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  task: TeyraTask
): Promise<string> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  if (!task.scheduled_time) {
    throw new Error('Task must have a scheduled time');
  }

  const startTime = new Date(task.scheduled_time);
  const endTime = new Date(startTime.getTime() + (task.duration_minutes || 60) * 60000);

  const event = {
    summary: task.title,
    description: `Created by Teyra\nTask ID: ${task.id}`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    colorId: task.completed ? '8' : '9', // Gray if completed, blue if active
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 }
      ]
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event
  });

  return response.data.id || '';
}

// Update calendar event
export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  task: TeyraTask
): Promise<void> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  if (!task.scheduled_time) {
    throw new Error('Task must have a scheduled time');
  }

  const startTime = new Date(task.scheduled_time);
  const endTime = new Date(startTime.getTime() + (task.duration_minutes || 60) * 60000);

  await calendar.events.patch({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: {
      summary: task.title,
      description: `Created by Teyra\nTask ID: ${task.id}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      colorId: task.completed ? '8' : '9'
    }
  });
}

// Delete calendar event
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string
): Promise<void> {
  const calendar = getCalendarClient(accessToken, refreshToken);

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId
  });
}

// Refresh access token if expired
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token;
}
