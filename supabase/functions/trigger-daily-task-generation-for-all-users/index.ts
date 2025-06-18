// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts" // Ensure serve is imported
import { corsHeaders } from '../_shared/cors.ts' // Assuming you have this for standard headers

console.log("Initializing trigger-daily-task-generation-for-all-users function v4") // Version Bump

serve(async (req: Request) => {
  console.log(`trigger-daily-task-generation-for-all-users (v4) received a ${req.method} request.`);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Server configuration error: Missing Supabase credentials.");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const now = new Date().toISOString();
    console.log(`Orchestrator running at: ${now}`);

    // Fetch all profiles that are due for new tasks.
    // Also fetch all the data needed by the generation function.
    const { data: profilesToUpdate, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, lifestyle, sustainability_focus, sustainability_knowledge, climate_challenges, next_task_due_at')
      .or(`next_task_due_at.is.null,next_task_due_at.lte.${now}`);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return new Response(JSON.stringify({ error: "Failed to fetch profiles", details: profilesError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!profilesToUpdate || profilesToUpdate.length === 0) {
      console.log("No profiles due for task generation.");
      return new Response(JSON.stringify({ message: "No profiles due for task generation." }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${profilesToUpdate.length} profiles due for new tasks. Invoking generation for each...`);

    const invocationPromises = profilesToUpdate.map(profile => {
      console.log(`Invoking task generation for user: ${profile.user_id}`);
      
      // We pass the full profile object to the generation function
      return supabaseAdmin.functions.invoke('generate-daily-tasks', {
        body: {
          user_id: profile.user_id,
          profile: profile // Pass the whole profile
        }
      });
    });

    const results = await Promise.allSettled(invocationPromises);

    let successes = 0;
    const errors: { user_id: string; error: string }[] = [];
    results.forEach((result, index) => {
      const user_id = profilesToUpdate[index].user_id;
      if (result.status === 'fulfilled' && !result.value.error) {
        successes++;
        console.log(`Successfully triggered task generation for ${user_id}`);
      } else {
        const errorMsg = result.status === 'rejected' ? result.reason.message : (result.value.error?.message || 'Unknown error');
        console.error(`Failed to trigger task generation for ${user_id}:`, errorMsg);
        errors.push({ user_id, error: errorMsg });
      }
    });

    const summary = `Orchestrator summary: Checked ${profilesToUpdate.length} profiles. Successful triggers: ${successes}. Failed triggers: ${errors.length}.`;
    console.log(summary);
    if (errors.length > 0) {
      console.warn("Failed invocations:", JSON.stringify(errors, null, 2));
    }

    return new Response(JSON.stringify({
      message: summary,
      successful_invocations: successes,
      failed_invocations: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: errors.length > 0 && successes > 0 ? 207 : (errors.length > 0 ? 500 : 200),
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Critical error in orchestrator main try-catch block:", error);
    return new Response(JSON.stringify({ error: "Critical error in orchestrator function", details: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

      curl -i --location --request POST 'https://vzgxfqqzejvrywntchnd.supabase.co/functions/v1/trigger-daily-task-generation-for-all-users' \
      --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Z3hmcXF6ZWp2cnl3bnRjaG5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDEzMTg3NCwiZXhwIjoyMDU5NzA3ODc0fQ.mkSO_qxmJ5GXk__AjMQqqHD9esvaFm81cEVT8_KNT9o' \
      --header 'Content-Type: application/json' \
      --data '{}'

*/
