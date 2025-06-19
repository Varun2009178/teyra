import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// +++ Import Google AI SDK +++
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.11.1";

// --- Inlined CORS Headers ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin (adjust in production if needed)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
// --- End Inlined CORS Headers ---

console.log("Initializing generate-daily-tasks function v4 (multi-task, impact_qualifier_unit)");

// --- Initialize Google AI SDK ---
// This function will now throw an error if the key is not found,
// preventing the function from running with a missing key.
function initializeGenAI() {
  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!apiKey) {
    console.error("CRITICAL: GOOGLE_AI_API_KEY environment variable is not set.");
    throw new Error("Server configuration error: Missing Google AI API Key.");
  }
  return new GoogleGenerativeAI(apiKey);
}

const genAI = initializeGenAI();
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function getTasksFromAI(profile: any) {
  if (!model) {
    console.error("Cannot call AI: Google AI SDK not initialized (missing API key?).");
    return [];
  }
  const { lifestyle, sustainability_focus, sustainability_knowledge, climate_challenges } = profile;
  const safeLifestyle = lifestyle || 'general';
  const safeSustainabilityFocus = Array.isArray(sustainability_focus) && sustainability_focus.length > 0 
                                  ? sustainability_focus.join(', ') 
                                  : (sustainability_focus || 'general_sustainability');
  const safeSustainabilityKnowledge = sustainability_knowledge || 'beginner';
  const safeClimateChallenges = Array.isArray(climate_challenges) && climate_challenges.length > 0
                                ? climate_challenges.join(', ')
                                : (climate_challenges || 'any');

  const prompt = `\
    You are an assistant that generates personalized daily eco-friendly tasks for an app called Teyra.
    Generate TWO TO FOUR actionable tasks suitable for a user with this profile:
    - Current Lifestyle: ${safeLifestyle}
    - Primary Sustainability Focuses: ${safeSustainabilityFocus}
    - Sustainability Knowledge Level: ${safeSustainabilityKnowledge}
    - Key Climate Challenges in their Area: ${safeClimateChallenges}

    Task Guidelines:
    - CRITICAL: Each task MUST be a simple, daily achievable action. Aim for tasks that can be done in roughly 5-15 minutes.
    - Task difficulty and type MUST be strongly influenced by the user's profile.
    - Keep each task description concise (max 15-20 words).
    - Assign an estimated XP value (integer between 5 and 15) for each task.
    - Assign an eco_score (integer between 5 and 25) representing the positive environmental impact.

    Output Format:
    Return the tasks ONLY as a valid JSON array of objects. Each object MUST have a "description" (string), "xp_value" (integer), and "eco_score" (integer) key. Strictly adhere to this format.

    Example JSON output for MULTIPLE tasks:
    [
      {"description": "Use a reusable shopping bag today.", "xp_value": 5, "eco_score": 15},
      {"description": "Unplug one unused appliance before leaving home.", "xp_value": 7, "eco_score": 10},
      {"description": "Shorten your shower by 2 minutes.", "xp_value": 10, "eco_score": 20}
    ]
  `;
  console.log(`Attempting to generate 2-4 tasks for profile: Lifestyle=${safeLifestyle}, Focuses=${safeSustainabilityFocus}, Knowledge=${safeSustainabilityKnowledge}, Climate=${safeClimateChallenges}`);
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    if (!response || typeof response.text !== 'function') {
      console.error("Invalid response structure from AI API:", response);
      return [];
    }
    const text = response.text();
    console.log("Raw AI Response Text:", text);
    let jsonString = text.trim();
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      jsonString = match[1].trim();
    }
    console.log("Attempting to parse JSON string:", jsonString);
    let tasks = JSON.parse(jsonString);
    if (!Array.isArray(tasks) || tasks.some((t: any) => typeof t.description !== 'string' || typeof t.xp_value !== 'number' || typeof t.eco_score !== 'number')) {
      if (typeof tasks.description === 'string' && typeof tasks.xp_value === 'number' && typeof tasks.eco_score === 'number') {
        console.warn("AI returned a single task object, wrapping in array.");
        tasks = [tasks];
      } else {
        console.error("AI response JSON format invalid or empty after parsing.", tasks);
        return [];
      }
    }
    if (tasks.length === 0) {
        console.error("AI response resulted in an empty task array.", tasks);
        return [];
    }

    console.log(`Successfully parsed ${tasks.length} AI tasks:`, tasks);
    return tasks.slice(0, 4); // Ensure we don't exceed 4 tasks
  } catch (error) {
    console.error("Error calling Google AI API or parsing response:", error);
    return [];
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    let userId = null;
    let requestedDate = null;
    let profileData = null; // To store the received profile data

    try {
      const body = await req.json();
      if (!body || typeof body.user_id !== 'string') {
        throw new Error("Missing or invalid 'user_id' in request body.");
      }
      userId = body.user_id;

      // Expect the full profile to be passed in
      if (!body.profile) {
          throw new Error("Missing 'profile' object in request body.");
      }
      profileData = body.profile;


      if (body.assigned_date && typeof body.assigned_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.assigned_date)) {
        requestedDate = body.assigned_date;
        console.log(`Received requested date: ${requestedDate} (initial task).`);
      } else {
        console.log("No specific assigned_date provided, will use server's current UTC date.");
      }
    } catch (e) {
      console.error("Failed to parse request body or get required data:", e);
      return new Response(JSON.stringify({ error: `Invalid request body: ${e.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    console.log(`Function invoked for user_id: ${userId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase environment variables (URL or Service Role Key)");
      throw new Error("Server configuration error.");
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // We no longer fetch the profile, we use the one passed in.
    // This avoids race conditions where the function runs before the profile insert is fully committed/replicated.
    console.log("Using profile data passed directly in the request body.");
    
    const dateToUse = requestedDate || new Date().toISOString().split('T')[0];
    console.log(`Using date for tasks: ${dateToUse}`);

    // Check for existing tasks is still a good idea.
    const { count, error: checkError } = await supabaseAdmin
      .from('daily_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('assigned_date', dateToUse);

    if (checkError) throw checkError;

    if (count !== null && count > 0) { 
      console.log(`Tasks already exist for user ${userId} on ${dateToUse}. Count: ${count}. Skipping generation.`);
      return new Response(JSON.stringify({ message: `Tasks already exist for ${dateToUse} (${count} found)` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    console.log(`No existing tasks found for user ${userId} on ${dateToUse}. Proceeding with generation.`);
    // Pass the received profile data to the AI function
    const suggestedTasks = await getTasksFromAI(profileData);

    if (!suggestedTasks || suggestedTasks.length === 0) {
      console.log(`AI did not return valid tasks for user ${userId}.`);
      // Return a more specific error to the client
      return new Response(JSON.stringify({ error: "The AI failed to generate tasks based on the profile." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    const tasksToInsert = suggestedTasks.map((task: any) => ({
      user_id: userId,
      task_description: task.description.toLowerCase(),
      xp_value: task.xp_value || 10,
      assigned_date: dateToUse,
      is_completed: false,
      eco_score: task.eco_score || 10,
    }));

    console.log(`Attempting to insert ${tasksToInsert.length} tasks for user ${userId}`);
    const { data: insertedTasks, error: insertError } = await supabaseAdmin
      .from('daily_tasks')
      .insert(tasksToInsert)
      .select(); // Important: .select() to get the data back if needed, and confirms operation.

    if (insertError) throw insertError;

    console.log(`Successfully inserted ${tasksToInsert.length} tasks for user ${userId}`);

    // The rest of the function for updating next_task_due_at remains the same
    // but we can't base it on profile.created_at anymore.
    // We'll just base it on the current time.
    const baseTimeForNextDue = new Date(); // Current UTC time
    console.log(`Basing next_task_due_at on current time: ${baseTimeForNextDue.toISOString()}`);
    
    const nextTaskDueDate = new Date(baseTimeForNextDue.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours
    console.log(`Next task cycle for user ${userId} will start after: ${nextTaskDueDate.toISOString()}`);
    
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ next_task_due_at: nextTaskDueDate.toISOString() })
      .eq('user_id', userId);

    if (updateProfileError) {
      console.error("Error updating next_task_due_at in profiles table:", updateProfileError);
      // Don't throw, allow the function to return success for task generation if that part worked.
    } else {
      console.log(`Successfully updated next_task_due_at for user ${userId} to ${nextTaskDueDate.toISOString()}`);
    }

    return new Response(JSON.stringify({
      message: `Generated and inserted ${tasksToInsert.length} tasks for user ${userId} on ${dateToUse}. Profile next_task_due_at updated.`,
      tasks_generated: (insertedTasks || []).length,
      task_assigned_date: dateToUse,
      next_task_due_at: nextTaskDueDate.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("Caught error in main function handler:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    // Attempt to stringify the error object itself for more details if it's a Supabase error
    const errorDetails = (error && typeof error === 'object' && error.message) ? JSON.stringify(error) : errorMessage;
    return new Response(JSON.stringify({ error: `Main handler error: ${errorDetails}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
