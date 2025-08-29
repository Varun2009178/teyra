import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase connection...');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`URL: ${url ? '✅ Set' : '❌ Missing'}`);
  console.log(`Anon Key: ${anonKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`Service Key: ${serviceKey ? '✅ Set' : '❌ Missing'}`);

  if (!url || !anonKey) {
    console.error('❌ Missing required environment variables');
    return;
  }

  // Test with anon key
  console.log('\n🔍 Testing with anon key...');
  const anonClient = createClient(url, anonKey);
  
  try {
    const { data, error } = await anonClient
      .from('user_progress')
      .select('user_id')
      .limit(1);
      
    if (error) {
      console.error('❌ Anon key error:', error.message);
    } else {
      console.log(`✅ Anon key works - found ${data?.length || 0} records`);
    }
  } catch (err) {
    console.error('❌ Anon key exception:', err);
  }

  // Test with service key
  if (serviceKey) {
    console.log('\n🔑 Testing with service role key...');
    const serviceClient = createClient(url, serviceKey);
    
    try {
      const { data, error } = await serviceClient
        .from('user_progress')
        .select('user_id')
        .limit(1);
        
      if (error) {
        console.error('❌ Service key error:', error.message);
      } else {
        console.log(`✅ Service key works - found ${data?.length || 0} records`);
      }
    } catch (err) {
      console.error('❌ Service key exception:', err);
    }
  }
}

testSupabaseConnection().catch(console.error);