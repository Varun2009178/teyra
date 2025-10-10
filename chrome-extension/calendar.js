// Google Calendar Integration for Teyra

let googleAuthToken = null;

// Authenticate with Google
async function authenticateGoogle() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error('Auth error:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      googleAuthToken = token;
      resolve(token);
    });
  });
}

// Parse date/time from text
function parseDateTime(text) {
  console.log('parseDateTime called with:', text);
  const now = new Date();
  const result = {
    date: null,
    time: null,
    hasDeadline: false
  };

  // Check for "tomorrow"
  if (text.toLowerCase().includes('tomorrow')) {
    console.log('Found tomorrow in text');
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.date = tomorrow;
    result.hasDeadline = true;
  }

  // Check for "today"
  if (text.toLowerCase().includes('today')) {
    result.date = new Date(now);
    result.hasDeadline = true;
  }

  // Check for day of week (Monday, Tuesday, etc.)
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayMatch = text.toLowerCase().match(new RegExp(`\\b(${days.join('|')})\\b`, 'i'));
  if (dayMatch) {
    const targetDay = days.indexOf(dayMatch[1].toLowerCase());
    const today = now.getDay();
    let daysUntil = targetDay - today;
    if (daysUntil < 0) daysUntil += 7;

    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + daysUntil);
    result.date = targetDate;
    result.hasDeadline = true;
  }

  // Check for time (9 PM, 3:00 PM, etc.)
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3].toUpperCase();

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    result.time = { hours, minutes };
  }

  // Check for "before X" pattern
  const beforeMatch = text.match(/before\s+(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)/i);
  if (beforeMatch) {
    let hours = parseInt(beforeMatch[1]);
    const minutes = beforeMatch[2] ? parseInt(beforeMatch[2]) : 0;
    const meridiem = beforeMatch[3].toUpperCase();

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    result.time = { hours, minutes };

    // If we have time from "before", we should have a deadline
    if (!result.date) {
      // Default to today if no date specified
      result.date = new Date(now);
    }
    result.hasDeadline = true;
  }

  // Set hasDeadline if we have both date and time, or just a date
  if (result.date) {
    result.hasDeadline = true;
  }

  console.log('parseDateTime result:', result);
  return result;
}

// Create calendar event
async function createCalendarEvent(taskTitle, dateTime) {
  if (!googleAuthToken) {
    await authenticateGoogle();
  }

  const { date, time } = dateTime;

  // Set default time if not specified (9 AM)
  const eventTime = time || { hours: 9, minutes: 0 };

  const startDateTime = new Date(date);
  startDateTime.setHours(eventTime.hours, eventTime.minutes, 0, 0);

  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(startDateTime.getHours() + 1); // 1 hour duration

  const event = {
    summary: taskTitle,
    description: `Created by Teyra`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 15 }
      ]
    }
  };

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAuthToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`Calendar API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Calendar event created:', result);
    return result;
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    throw error;
  }
}

// Check if user has calendar connected
async function isCalendarConnected() {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, function(token) {
      resolve(!!token && !chrome.runtime.lastError);
    });
  });
}

// Disconnect calendar
function disconnectCalendar() {
  if (googleAuthToken) {
    chrome.identity.removeCachedAuthToken({ token: googleAuthToken }, () => {
      googleAuthToken = null;
      console.log('Calendar disconnected');
    });
  }
}

// Make functions globally available for content script
window.authenticateGoogle = authenticateGoogle;
window.parseDateTime = parseDateTime;
window.createCalendarEvent = createCalendarEvent;
window.isCalendarConnected = isCalendarConnected;
window.disconnectCalendar = disconnectCalendar;
