import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function verifyProductionClerkUsers() {
  console.log('🔍 Verifying users in PRODUCTION Clerk...')
  
  // Check which key we're using
  const clerkKey = process.env.CLERK_SECRET_KEY || process.env.PRODUCTION_CLERK_SECRET_KEY
  
  if (!clerkKey) {
    console.error('❌ No Clerk Secret Key found!')
    return
  }
  
  console.log('🔑 Using key type:', clerkKey.includes('sk_test_') ? 'TEST' : 'LIVE')
  console.log('🔑 Key starts with:', clerkKey.substring(0, 20) + '...')
  
  try {
    // First, let's check what instance this key belongs to
    const instanceResponse = await fetch('https://api.clerk.com/v1/instance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (instanceResponse.ok) {
      const instanceData = await instanceResponse.json()
      console.log('\n🏢 Clerk Instance Info:')
      console.log('Instance ID:', instanceData.id)
      console.log('Environment:', instanceData.environment)
      console.log('Domain:', instanceData.domain)
    }
    
    // Now get all users
    const response = await fetch('https://api.clerk.com/v1/users?limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Error fetching users:', error)
      return
    }
    
    const data = await response.json()
    const users = data.data || []
    
    console.log(`\n📊 Found ${users.length} users in this Clerk instance:`)
    console.log('=' * 60)
    
    if (users.length === 0) {
      console.log('❌ No users found! This might mean:')
      console.log('1. You\'re using the wrong Clerk key')
      console.log('2. You\'re looking at the wrong Clerk instance')
      console.log('3. The users weren\'t actually created')
    } else {
      users.forEach((user: any, index: number) => {
        const email = user.email_addresses?.[0]?.email_address || 'No email'
        const firstName = user.first_name || 'No first name'
        const lastName = user.last_name || 'No last name'
        const createdAt = new Date(user.created_at).toLocaleDateString()
        const status = user.status || 'unknown'
        
        console.log(`${index + 1}. ${firstName} ${lastName}`)
        console.log(`   📧 ${email}`)
        console.log(`   📅 Created: ${createdAt}`)
        console.log(`   🆔 ID: ${user.id}`)
        console.log(`   📊 Status: ${status}`)
        console.log('')
      })
    }
    
    // Check if we're looking at the right instance
    console.log('\n🔍 Troubleshooting:')
    console.log('1. Are you looking at the correct Clerk dashboard?')
    console.log('2. Is this the production instance for teyra.app?')
    console.log('3. Did the script actually create users or just say it did?')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

verifyProductionClerkUsers() 