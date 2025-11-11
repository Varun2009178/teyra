import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }
    
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userResponse, tabSwitchCount, isWhitelisted } = await request.json();
    
    if (!userResponse || typeof userResponse !== 'string') {
      return NextResponse.json({ error: 'User response is required' }, { status: 400 });
    }

    // Create AI prompt - Mike gets progressively angrier with more tab switches
    const angerLevel = Math.min(tabSwitchCount || 1, 5); // Cap at 5
    const angerContext = angerLevel === 1 
      ? "This is their first tab switch. Be mildly concerned but understanding."
      : angerLevel === 2
      ? "This is their second tab switch. Show some frustration but still be reasonable."
      : angerLevel === 3
      ? "This is their third tab switch. Get noticeably frustrated and stern."
      : angerLevel >= 4
      ? "They've switched tabs multiple times. Get VERY angry and demanding. Use caps and exclamation marks. Be harsh but still in character as Mike the Cactus."
      : "Be concerned but understanding.";

    const prompt = `You are Mike the Cactus, a Gen Z productivity companion who helps users stay focused. A user just switched tabs during a 30-minute focus session and gave this explanation:

USER'S EXPLANATION: "${userResponse}"

CONTEXT:
- Tab switch number: ${tabSwitchCount || 1}
- ${angerContext}

SPECIAL INSTRUCTIONS:
- If they mention YouTube, respond like: "bro youtube. are we being fr right now 😭" or similar Gen Z language
- If the site is whitelisted (isWhitelisted: ${isWhitelisted || false}), be understanding and accept it without getting angry
- Use Gen Z slang: "fr" (for real), "no cap", "bro", "deadass", "lowkey", "ngl" (not gonna lie), "tbh" (to be honest)
- Be relatable and use emojis occasionally (🌵, 😭, 💀, fr)
- Match the energy level - get progressively more frustrated with more tab switches
- If they're procrastinating on social media/entertainment, call them out in Gen Z style
- If legitimate work reason, be understanding but still remind them to focus

Your job is to:
1. Detect if they're on YouTube, TikTok, Instagram, Twitter, etc. - call them out Gen Z style
2. Analyze if their explanation is legitimate (work-related, educational, necessary) or procrastination
3. Respond appropriately based on the anger level with Gen Z language
4. If legitimate: Accept it but remind them to stay focused (Gen Z style)
5. If procrastinating: Get progressively angrier (Gen Z style) and demand they get back to work

Respond with ONLY a short, direct message (1-2 sentences max). Use Gen Z slang naturally. Match the anger level - be progressively angrier with more tab switches. Use caps and exclamation marks when angry. Stay in character as Mike the Cactus.

Your response should be in this JSON format:
{
  "response": "Your Gen Z response message here",
  "mood": "happy" | "neutral" | "sad" | "angry"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are Mike the Cactus, a Gen Z productivity companion who helps users stay focused. You use Gen Z slang naturally (fr, no cap, bro, deadass, lowkey, ngl, tbh) and emojis occasionally. You can get frustrated when users procrastinate, but you're understanding when they have legitimate reasons. Always respond in valid JSON format. If they mention YouTube, TikTok, Instagram, or other distracting sites, call them out in Gen Z style."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let aiResponse;
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      // Fallback response based on anger level - Gen Z style
      const userLower = userResponse.toLowerCase();
      const isYouTube = userLower.includes('youtube') || userLower.includes('yt');
      const isDistracting = userLower.includes('tiktok') || userLower.includes('instagram') || userLower.includes('twitter') || userLower.includes('reddit') || isYouTube;
      
      if (isYouTube && angerLevel >= 2) {
        aiResponse = { response: "bro youtube. are we being fr right now 😭", mood: "angry" };
      } else if (isDistracting) {
        const fallbackResponses = [
          { response: "ok fr but stay focused!", mood: "happy" },
          { response: "alright but try to stay focused bro", mood: "neutral" },
          { response: "deadass? get back to work!", mood: "sad" },
          { response: "BRO THIS IS GETTING RIDICULOUS. GET BACK TO WORK NOW FR 😭", mood: "angry" },
          { response: "I'M DONE FR. GET BACK TO WORK OR END THE SESSION 💀", mood: "angry" }
        ];
        aiResponse = fallbackResponses[Math.min(angerLevel - 1, fallbackResponses.length - 1)];
      } else {
        const fallbackResponses = [
          { response: "ok, that's fine. stay focused!", mood: "happy" },
          { response: "alright, but try to stay focused!", mood: "neutral" },
          { response: "seriously? get back to work!", mood: "sad" },
          { response: "THIS IS GETTING RIDICULOUS. GET BACK TO WORK NOW!", mood: "angry" },
          { response: "I'M DONE WITH THIS. GET BACK TO WORK OR END THE SESSION!", mood: "angry" }
        ];
        aiResponse = fallbackResponses[Math.min(angerLevel - 1, fallbackResponses.length - 1)];
      }
    }

    return NextResponse.json(aiResponse);
    
  } catch (error) {
    console.error('Error in AI focus mode response:', error);
    
    // Fallback response
    return NextResponse.json({
      response: "GET BACK TO WORK",
      mood: "angry"
    });
  }
}

