import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function debugClerkPermissions() {
  console.log('🔍 Debugging Clerk Permissions and User States...')
  
  const clerkKey = process.env.CLERK_SECRET_KEY || process.env.PRODUCTION_CLERK_SECRET_KEY
  
  if (!clerkKey) {
    console.error('❌ No Clerk Secret Key found!')
    return
  }
  
  console.log('🔑 Using LIVE keys:', clerkKey.includes('sk_live_'))
  
  try {
    // Test 1: Check if we can list users with different parameters
    console.log('\n🔍 Test 1: Trying different user listing approaches...')
    
    const approaches = [
      { name: 'Basic list', url: 'https://api.clerk.com/v1/users' },
      { name: 'With limit', url: 'https://api.clerk.com/v1/users?limit=10' },
      { name: 'With offset', url: 'https://api.clerk.com/v1/users?offset=0&limit=10' },
      { name: 'With status filter', url: 'https://api.clerk.com/v1/users?status=active' },
      { name: 'With email filter', url: 'https://api.clerk.com/v1/users?email_address=test' }
    ]
    
    for (const approach of approaches) {
      const response = await fetch(approach.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${clerkKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`📡 ${approach.name}: Status ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        const users = data.data || []
        console.log(`   📊 Found ${users.length} users`)
        
        if (users.length > 0) {
          console.log(`   📋 First user: ${users[0].email_addresses?.[0]?.email_address || 'No email'}`)
        }
      } else {
        const error = await response.text()
        console.log(`   ❌ Error: ${error.substring(0, 100)}...`)
      }
    }
    
    // Test 2: Try to get a specific user by ID
    console.log('\n🔍 Test 2: Getting specific user by ID...')
    const testUserId = 'user_3043WykRaceBMDQphXDE9Lql2SG' // From previous test
    
    const specificResponse = await fetch(`https://api.clerk.com/v1/users/${testUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log(`📡 Specific user fetch: Status ${specificResponse.status}`)
    
    if (specificResponse.ok) {
      const user = await specificResponse.json()
      console.log('✅ Found specific user:', {
        id: user.id,
        email: user.email_addresses?.[0]?.email_address,
        status: user.status,
        created_at: user.created_at
      })
    } else {
      const error = await specificResponse.text()
      console.log(`❌ Error: ${error}`)
    }
    
    // Test 3: Check if there are any users with different statuses
    console.log('\n🔍 Test 3: Checking for users with different statuses...')
    
    const statuses = ['active', 'inactive', 'pending']
    
    for (const status of statuses) {
      const response = await fetch(`https://api.clerk.com/v1/users?status=${status}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${clerkKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const users = data.data || []
        console.log(`📊 ${status} users: ${users.length}`)
      }
    }
    
    // Test 4: Check if we need different permissions
    console.log('\n🔍 Test 4: Checking API permissions...')
    
    const permissionsResponse = await fetch('https://api.clerk.com/v1/instance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (permissionsResponse.ok) {
      const instanceData = await permissionsResponse.json()
      console.log('🏢 Instance details:', {
        id: instanceData.id,
        environment: instanceData.environment,
        domain: instanceData.domain,
        features: instanceData.features
      })
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error)
  }
}

debugClerkPermissions() 