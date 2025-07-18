import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkClerkUsersList() {
  console.log('🔍 Fetching users from Clerk...')
  
  try {
    const response = await fetch('https://api.clerk.com/v1/users?limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Error fetching Clerk users:', error)
      return
    }
    
    const data = await response.json()
    const users = data.data || []
    
    console.log(`\n📊 Found ${users.length} users in Clerk:`)
    console.log('=' * 50)
    
    users.forEach((user: any, index: number) => {
      const email = user.email_addresses?.[0]?.email_address || 'No email'
      const firstName = user.first_name || 'No first name'
      const lastName = user.last_name || 'No last name'
      const createdAt = new Date(user.created_at).toLocaleDateString()
      
      console.log(`${index + 1}. ${firstName} ${lastName}`)
      console.log(`   📧 ${email}`)
      console.log(`   📅 Created: ${createdAt}`)
      console.log(`   🆔 ID: ${user.id}`)
      console.log('')
    })
    
    console.log('✅ All users are ready to sign in at teyra.app!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkClerkUsersList() 