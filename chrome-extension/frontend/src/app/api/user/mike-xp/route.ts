import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Using shared singleton

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { xp, level, xpForNextLevel, totalSessions, distractionFreeSessions } = body

    // Update Mike XP data in user_progress table
    const { data, error } = await supabase
      .from('user_progress')
      .update({
        mike_xp: xp,
        mike_level: level,
        mike_xp_for_next_level: xpForNextLevel,
        mike_total_sessions: totalSessions,
        mike_distraction_free_sessions: distractionFreeSessions,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error updating Mike XP:', error)
      return NextResponse.json({ error: 'Failed to sync Mike XP' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data?.[0]
    })
  } catch (error) {
    console.error('Error syncing Mike XP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Mike XP data from user_progress table
    const { data, error } = await supabase
      .from('user_progress')
      .select('mike_xp, mike_level, mike_xp_for_next_level, mike_total_sessions, mike_distraction_free_sessions')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching Mike XP:', error)
      return NextResponse.json({ error: 'Failed to fetch Mike XP' }, { status: 500 })
    }

    return NextResponse.json({
      xp: data?.mike_xp || 0,
      level: data?.mike_level || 1,
      xpForNextLevel: data?.mike_xp_for_next_level || 100,
      totalSessions: data?.mike_total_sessions || 0,
      distractionFreeSessions: data?.mike_distraction_free_sessions || 0
    })
  } catch (error) {
    console.error('Error fetching Mike XP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
