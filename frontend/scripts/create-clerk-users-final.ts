import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

interface UserMigrationData {
  old_user_id: string
  email: string
  name: string
  current_streak: string
  tasks_completed: string
  last_task_completed: string
  longest_streak: string
  cactus_state: string
  new_user_id: string | null
  migrated: boolean
}

async function createClerkUsersFinal() {
  console.log('🚀 Creating Clerk users with proper parameters...')
  
  const clerkKey = process.env.CLERK_SECRET_KEY || process.env.PRODUCTION_CLERK_SECRET_KEY
  
  if (!clerkKey) {
    console.error('❌ No Clerk Secret Key found!')
    return
  }
  
  console.log('🔑 Using LIVE keys:', clerkKey.includes('sk_live_'))
  
  try {
    // Read the user mapping file
    const userMappingPath = path.join(__dirname, 'user-mapping.json')
    const userMappingData: UserMigrationData[] = JSON.parse(fs.readFileSync(userMappingPath, 'utf8'))
    
    console.log(`📊 Found ${userMappingData.length} users to create`)
    
    let createdCount = 0
    let skippedCount = 0
    let errorCount = 0
    const createdUsers: any[] = []
    
    for (const userData of userMappingData) {
      try {
        // Skip if no email
        if (!userData.email || userData.email.trim() === '') {
          console.log(`⚠️ Skipping user with no email: ${userData.name}`)
          skippedCount++
          continue
        }
        
        console.log(`👤 Creating user: ${userData.email} (${userData.name})...`)
        
        // Create user with proper parameters
        const createResponse = await fetch('https://api.clerk.com/v1/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${clerkKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email_address: [userData.email],
            first_name: userData.name.split(' ')[0] || userData.name,
            last_name: userData.name.split(' ').slice(1).join(' ') || '',
            password: null, // Let them set their own password
            public_metadata: {
              migrated_user: true,
              old_user_id: userData.old_user_id,
              tasks_completed: userData.tasks_completed,
              current_streak: userData.current_streak,
              longest_streak: userData.longest_streak
            },
            private_metadata: {
              migration_date: new Date().toISOString()
            },
            skip_password_requirement: true,
            skip_password_checks: true
          }),
        })
        
        if (createResponse.ok) {
          const user = await createResponse.json()
          console.log(`✅ Created user: ${userData.email} (ID: ${user.id})`)
          createdUsers.push({
            email: userData.email,
            name: userData.name,
            clerk_id: user.id,
            status: user.status
          })
          createdCount++
          
          // Wait a bit between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } else {
          const error = await createResponse.text()
          console.error(`❌ Failed to create ${userData.email}: ${error}`)
          errorCount++
        }
        
      } catch (error) {
        console.error(`❌ Error creating ${userData.email}:`, error)
        errorCount++
      }
    }
    
    console.log('\n📊 Creation Summary:')
    console.log(`✅ Successfully created: ${createdCount}`)
    console.log(`⏭️ Skipped (no email): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📝 Total processed: ${userMappingData.length}`)
    
    // Save created users to a file
    if (createdUsers.length > 0) {
      const outputPath = path.join(__dirname, 'created-clerk-users.json')
      fs.writeFileSync(outputPath, JSON.stringify(createdUsers, null, 2))
      console.log(`\n💾 Created users saved to: ${outputPath}`)
    }
    
    // Test listing users again
    console.log('\n🔍 Testing user listing after creation...')
    const listResponse = await fetch('https://api.clerk.com/v1/users?limit=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkKey}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (listResponse.ok) {
      const data = await listResponse.json()
      const users = data.data || []
      console.log(`📊 Found ${users.length} users in list`)
      
      if (users.length > 0) {
        console.log('📋 Sample users:')
        users.slice(0, 3).forEach((user: any) => {
          console.log(`   - ${user.email_addresses?.[0]?.email_address || 'No email'} (${user.id})`)
        })
      }
    } else {
      console.log('❌ Still cannot list users')
    }
    
    if (createdCount > 0) {
      console.log('\n🎉 Users created successfully!')
      console.log('📧 They should now appear in your Clerk dashboard')
      console.log('🔐 Users can sign in with their email (they\'ll need to set a password)')
    }
    
  } catch (error) {
    console.error('❌ User creation failed:', error)
  }
}

createClerkUsersFinal() 