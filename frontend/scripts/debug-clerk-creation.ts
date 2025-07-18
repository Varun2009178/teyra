import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function debugClerkCreation() {
  console.log('🔍 Detailed Clerk Debugging...')
  
  const clerkKey = process.env.CLERK_SECRET_KEY || process.env.PRODUCTION_CLERK_SECRET_KEY
  
  if (!clerkKey) {
    console.error('❌ No Clerk Secret Key found!')
    return
  }
  
  console.log('🔑 Key type:', clerkKey.includes('sk_test_') ? 'TEST' : 'LIVE')
  console.log('🔑 Key starts with:', clerkKey.substring(0, 20) + '...')
  
  try {
    // Test 1: Check instance info
    console.log('\n🔍 Test 1: Checking Clerk instance...')
    const instanceResponse = await fetch('https://api.clerk.com/v1/instance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (instanceResponse.ok) {
      const instanceData = await instanceResponse.json()
      console.log('✅ Instance Info:', {
        id: instanceData.id,
        environment: instanceData.environment,
        domain: instanceData.domain
      })
    } else {
      console.error('❌ Failed to get instance info:', await instanceResponse.text())
    }
    
    // Test 2: Try to create a test user
    console.log('\n🔍 Test 2: Trying to create a test user...')
    const testEmail = `test-${Date.now()}@example.com`
    
    const createResponse = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: [testEmail],
        first_name: 'Test',
        last_name: 'User',
        password: null,
        skip_password_requirement: true,
        skip_password_checks: true
      })
    })
    
    console.log('📡 Create Response Status:', createResponse.status)
    
    if (createResponse.ok) {
      const createdUser = await createResponse.json()
      console.log('✅ Successfully created test user:', {
        id: createdUser.id,
        email: createdUser.email_addresses?.[0]?.email_address
      })
      
      // Test 3: Immediately fetch all users to see if it appears
      console.log('\n🔍 Test 3: Fetching all users after creation...')
      const fetchResponse = await fetch('https://api.clerk.com/v1/users?limit=100', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${clerkKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json()
        const users = fetchData.data || []
        console.log(`📊 Found ${users.length} users after creation`)
        
        const testUser = users.find((u: any) => 
          u.email_addresses?.[0]?.email_address === testEmail
        )
        
        if (testUser) {
          console.log('✅ Test user found in list!')
        } else {
          console.log('❌ Test user NOT found in list!')
        }
      }
      
    } else {
      const errorData = await createResponse.json()
      console.error('❌ Failed to create test user:', errorData)
    }
    
    // Test 4: Check if there are any users at all
    console.log('\n🔍 Test 4: Final user count check...')
    const finalResponse = await fetch('https://api.clerk.com/v1/users?limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json()
      const finalUsers = finalData.data || []
      console.log(`📊 Final user count: ${finalUsers.length}`)
      
      if (finalUsers.length > 0) {
        console.log('📋 First few users:')
        finalUsers.slice(0, 3).forEach((user: any, index: number) => {
          const email = user.email_addresses?.[0]?.email_address || 'No email'
          console.log(`  ${index + 1}. ${email} (ID: ${user.id})`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error)
  }
}

debugClerkCreation() 