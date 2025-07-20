import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Webhook } from 'svix'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEW_SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    
    // Verify webhook signature
    const svix_id = headersList.get('svix-id')
    const svix_timestamp = headersList.get('svix-timestamp')
    const svix_signature = headersList.get('svix-signature')
    
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('❌ Missing Svix headers')
      return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 })
    }
    
    // Create webhook instance
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')
    
    let event
    try {
      event = webhook.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (error) {
      console.error('❌ Webhook verification failed:', error)
      return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 })
    }
    
    console.log('📡 Clerk webhook received:', event.type)
    
    // Handle user deletion
    if (event.type === 'user.deleted') {
      const userId = event.data.id
      console.log('🗑️ User deleted from Clerk:', userId)
      
      try {
        // Delete all user data from Supabase
        console.log('🗄️ Cleaning up user data from Supabase...')
        
        // Delete all tasks for this user
        const { error: tasksError } = await supabase
          .from('tasks')
          .delete()
          .eq('userId', userId)
        
        if (tasksError) {
          console.error('❌ Error deleting tasks:', tasksError)
        } else {
          console.log('✅ Tasks deleted for user:', userId)
        }
        
        // Delete user stats
        const { error: statsError } = await supabase
          .from('user_stats')
          .delete()
          .eq('userId', userId)
        
        if (statsError) {
          console.error('❌ Error deleting user stats:', statsError)
        } else {
          console.log('✅ User stats deleted for user:', userId)
        }
        
        console.log('✅ User data cleanup completed for:', userId)
        
      } catch (error) {
        console.error('❌ Error during user data cleanup:', error)
        return NextResponse.json({ error: 'Database cleanup failed' }, { status: 500 })
      }
    }
    
    // Handle other user events if needed
    if (event.type === 'user.updated') {
      console.log('👤 User updated:', event.data.id)
    }
    
    if (event.type === 'user.created') {
      console.log('👤 User created:', event.data.id)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 