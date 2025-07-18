import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkProductionClerk() {
  console.log('🔍 Checking Clerk configuration...')
  
  console.log('\n📋 Current Environment Variables:')
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 20) + '...')
  console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY?.substring(0, 20) + '...')
  
  console.log('\n🔍 Key Analysis:')
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('pk_test_')) {
    console.log('❌ Using TEST keys (pk_test_) - these are for development')
  } else if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('pk_live_')) {
    console.log('✅ Using LIVE keys (pk_live_) - these are for production')
  } else {
    console.log('❓ Unknown key format')
  }
  
  console.log('\n📝 To create users in production Clerk, you need:')
  console.log('1. Production Clerk Secret Key (starts with sk_live_)')
  console.log('2. This should be different from your development key')
  console.log('3. You can find this in your production Clerk dashboard')
  
  console.log('\n🌐 Steps to get production keys:')
  console.log('1. Go to your production Clerk dashboard')
  console.log('2. Navigate to API Keys section')
  console.log('3. Copy the Secret Key (starts with sk_live_)')
  console.log('4. Update your .env.local with the production key')
  
  console.log('\n💡 Alternative: Check your Vercel environment variables')
  console.log('Your production app might be using different keys from Vercel')
}

checkProductionClerk() 