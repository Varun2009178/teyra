// Database types
export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  completed: boolean
  createdAt: string
  completedAt?: string
  assignedDate?: string
  expired?: boolean
  hasBeenSplit?: boolean
}

export interface UserStats {
  userId: string
  all_time_completed: number
  current_streak: number
  completed_this_week: number
  completed_today: number
  last_completed_date: string | null
  subscription_level: 'free' | 'basic' | 'pro'
  ai_suggestions_enabled: boolean
  user_mood: 'energized' | 'focused' | 'neutral' | 'tired' | 'stressed'
  show_analytics: boolean
  email?: string
  notifications_enabled: boolean
  timezone?: string
  last_activity_at?: string
  mood_checkins_today?: number
  ai_splits_today?: number
  last_daily_reset?: string
  last_task_summary?: string
  createdAt: string
  updatedAt: string
} 