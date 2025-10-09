import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { xp, source } = body // source: 'task_completion' | 'pomodoro' | 'sustainable_task'

    if (!xp || xp <= 0) {
      return NextResponse.json({ error: 'Invalid XP amount' }, { status: 400 })
    }

    // Get current XP data from user_progress
    const { data: progress, error: fetchError } = await supabase
      .from('user_progress')
      .select('mike_xp, mike_level, mike_xp_for_next_level')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching user progress:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 })
    }

    let currentXP = (progress?.mike_xp || 0) + xp
    let level = progress?.mike_level || 1
    let xpForNext = progress?.mike_xp_for_next_level || 100
    let leveledUp = false
    let levelsGained = 0

    // Check for level up (can level up multiple times)
    while (currentXP >= xpForNext) {
      level++
      currentXP -= xpForNext
      xpForNext = Math.floor(xpForNext * 1.5) // Each level requires 50% more XP
      leveledUp = true
      levelsGained++
    }

    // Update database with new XP and level
    const { error: updateError } = await supabase
      .from('user_progress')
      .update({
        mike_xp: currentXP,
        mike_level: level,
        mike_xp_for_next_level: xpForNext,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating Mike XP:', updateError)
      return NextResponse.json({ error: 'Failed to update XP' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      xp: currentXP,
      level,
      xpForNext,
      leveledUp,
      levelsGained,
      xpGained: xp,
      source
    })
  } catch (error) {
    console.error('Error awarding XP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
