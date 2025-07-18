import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function testCronJob() {
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.error('❌ CRON_SECRET not found in environment variables')
    process.exit(1)
  }

  console.log('🧪 Testing cron job...')
  
  try {
    const response = await fetch('http://localhost:3000/api/cron/daily-emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Cron job executed successfully!')
      console.log('📊 Results:', result)
    } else {
      console.error('❌ Cron job failed:', result)
    }
  } catch (error) {
    console.error('❌ Error testing cron job:', error)
  }
}

testCronJob() 