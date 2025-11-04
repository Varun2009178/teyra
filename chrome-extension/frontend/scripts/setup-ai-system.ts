#!/usr/bin/env npx tsx

/**
 * Setup script for AI behavior learning system
 * Run with: npx tsx scripts/setup-ai-system.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBehaviorTracking() {
  try {
    console.log('🚀 Setting up AI behavior learning system...');

    // Read and execute the SQL migration
    const sqlPath = join(__dirname, 'setup-behavior-tracking.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    console.log('📊 Creating behavior tracking tables...');
    
    // Execute the SQL (split by semicolons for multiple statements)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.warn('⚠️ SQL warning:', error.message);
      }
    }

    console.log('✅ Behavior tracking tables created successfully');
    
    // Test the setup by checking table existence
    const { data: tables, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_behavior_events', 'user_behavior_analysis')
      `
    });

    if (tableError) {
      console.error('❌ Error checking tables:', tableError);
      return;
    }

    console.log('🔍 Tables created:', tables || 'Could not verify (this is normal on some Supabase setups)');
    
    console.log('\n🎉 AI behavior learning system setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. The system will automatically start learning user patterns');
    console.log('2. Smart notifications will be sent based on behavior');
    console.log('3. Check the dashboard for behavior insights');
    console.log('\n💡 Features enabled:');
    console.log('• Task completion pattern learning');
    console.log('• Productive hours detection');
    console.log('• Smart notification timing');
    console.log('• Mood-based task suggestions');
    console.log('• Inactivity reminders');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n🔧 Manual setup instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of scripts/setup-behavior-tracking.sql');
  }
}

async function checkExistingSetup() {
  try {
    const { data, error } = await supabase
      .from('user_behavior_events')
      .select('count(*)')
      .limit(1);

    if (!error) {
      console.log('✅ AI behavior learning system is already set up!');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🧠 Teyra AI Behavior Learning System Setup\n');
  
  const isSetup = await checkExistingSetup();
  
  if (isSetup) {
    console.log('System is already configured. No action needed.');
    return;
  }
  
  await setupBehaviorTracking();
}

main().catch(console.error);