import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🧠 Fetching AI patterns for user: ${user.id.slice(-8)}`);

    // Get user's AI patterns
    const { data: aiPatterns, error: patternsError } = await supabase
      .from('user_ai_patterns')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (patternsError && patternsError.code !== 'PGRST116') {
      console.error('Error fetching AI patterns:', patternsError);
      return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 });
    }

    // If no patterns exist yet, return default data
    if (!aiPatterns) {
      console.log(`📝 No AI patterns found for user ${user.id.slice(-8)}, returning defaults`);
      return NextResponse.json({
        consistency_score: 0,
        productivity_peaks: [],
        mood_patterns: {},
        task_preferences: {},
        recommendations: []
      });
    }

    // Parse the stored patterns
    let parsedPatterns;
    try {
      parsedPatterns = {
        consistency_score: aiPatterns.consistency_score || 0,
        productivity_peaks: aiPatterns.productivity_peaks ? JSON.parse(aiPatterns.productivity_peaks) : [],
        mood_patterns: aiPatterns.mood_patterns ? JSON.parse(aiPatterns.mood_patterns) : {},
        task_preferences: aiPatterns.task_preferences ? JSON.parse(aiPatterns.task_preferences) : {},
        recommendations: []
      };

      // If we have the full patterns data, parse that too
      if (aiPatterns.patterns) {
        const fullPatterns = JSON.parse(aiPatterns.patterns);
        parsedPatterns.recommendations = fullPatterns.recommendations || [];
      }

    } catch (parseError) {
      console.error('Error parsing AI patterns:', parseError);
      return NextResponse.json({ error: 'Failed to parse patterns' }, { status: 500 });
    }

    console.log(`✅ AI patterns retrieved for user ${user.id.slice(-8)}:`, {
      consistencyScore: parsedPatterns.consistency_score,
      productivityPeaks: parsedPatterns.productivity_peaks?.length || 0,
      hasMoodPatterns: Object.keys(parsedPatterns.mood_patterns).length > 0,
      recommendations: parsedPatterns.recommendations?.length || 0
    });

    return NextResponse.json(parsedPatterns);

  } catch (error) {
    console.error('❌ Error fetching AI patterns:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch AI patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



