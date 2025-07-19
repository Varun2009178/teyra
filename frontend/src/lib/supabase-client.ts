'use client'

import { createBrowserClient } from '@supabase/ssr'

type GetToken = (options?: { template: string }) => Promise<string | null>;

// This function creates a new Supabase client.
// It's authenticated with the current user's session by passing getToken.
export function createClient(getToken: GetToken) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  )
}

// Function to get an authenticated Supabase client
export async function getAuthenticatedClient(getToken: GetToken) {
  const token = await getToken({ template: 'supabase' })
  
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  )
} 