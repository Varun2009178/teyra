// Google Analytics 4 setup
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = (action: string, {
  event_category,
  event_label,
  value,
  ...parameters
}: {
  event_category?: string
  event_label?: string
  value?: number
  [key: string]: any
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category,
      event_label,
      value,
      ...parameters,
    })
  }
}

// Custom events for Teyra
export const trackTaskCreated = (taskTitle: string) => {
  event('task_created', {
    event_category: 'tasks',
    event_label: taskTitle,
  })
}

export const trackTaskCompleted = (taskTitle: string) => {
  event('task_completed', {
    event_category: 'tasks', 
    event_label: taskTitle,
  })
}

export const trackMoodSelected = (mood: string) => {
  event('mood_selected', {
    event_category: 'engagement',
    event_label: mood,
  })
}

export const trackMilestoneReached = (milestone: string, points: number) => {
  event('milestone_reached', {
    event_category: 'achievement',
    event_label: milestone,
    value: points,
  })
}

export const trackDailyReset = (completedTasks: number) => {
  event('daily_reset', {
    event_category: 'engagement',
    value: completedTasks,
  })
}

export const trackUserSignup = () => {
  event('sign_up', {
    event_category: 'user',
  })
}

export const trackUserLogin = () => {
  event('login', {
    event_category: 'user',
  })
}