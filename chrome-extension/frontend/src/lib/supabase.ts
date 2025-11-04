import { createClient } from '@supabase/supabase-js'

let _supabase: ReturnType<typeof createClient> | null = null

const createSupabaseClient = () => {
  if (_supabase) return _supabase
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  _supabase = createClient(supabaseUrl, supabaseKey)
  return _supabase
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return createSupabaseClient()[prop as keyof ReturnType<typeof createClient>]
  }
})

// Database types (matching your current schema)
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: number
          user_id: string
          title: string
          completed: boolean
          limit: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          completed?: boolean
          limit?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          completed?: boolean
          limit?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: number
          user_id: string
          current_mood: string | null
          daily_mood_checks: number
          last_mood_update: string | null
          last_reset_date: string
          daily_start_time: string | null
          is_locked: boolean
          mike_xp: number | null
          mike_level: number | null
          mike_xp_for_next_level: number | null
          mike_total_sessions: number | null
          mike_distraction_free_sessions: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          current_mood?: string | null
          daily_mood_checks?: number
          last_mood_update?: string | null
          last_reset_date?: string
          daily_start_time?: string | null
          is_locked?: boolean
          mike_xp?: number | null
          mike_level?: number | null
          mike_xp_for_next_level?: number | null
          mike_total_sessions?: number | null
          mike_distraction_free_sessions?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          current_mood?: string | null
          daily_mood_checks?: number
          last_mood_update?: string | null
          last_reset_date?: string
          daily_start_time?: string | null
          is_locked?: boolean
          mike_xp?: number | null
          mike_level?: number | null
          mike_xp_for_next_level?: number | null
          mike_total_sessions?: number | null
          mike_distraction_free_sessions?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Typed supabase client
export const typedSupabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, prop) {
    const client = createSupabaseClient() as ReturnType<typeof createClient<Database>>
    return client[prop as keyof typeof client]
  }
})