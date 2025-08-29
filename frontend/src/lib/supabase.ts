import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Typed supabase client
export const typedSupabase = createClient<Database>(supabaseUrl, supabaseKey)