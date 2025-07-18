import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function checkClerkUsers() {
  console.log('🔍 Checking Clerk configuration...')
  
  console.log('\n📋 Environment Variables:')
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing')
  console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing')
  
  console.log('\n🌐 Clerk URLs:')
  console.log('NEXT_PUBLIC_CLERK_SIGN_IN_URL:', process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'Not set')
  console.log('NEXT_PUBLIC_CLERK_SIGN_UP_URL:', process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || 'Not set')
  console.log('NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:', process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || 'Not set')
  console.log('NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:', process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || 'Not set')
  
  console.log('\n📝 Important Notes:')
  console.log('• Clerk users are created when they sign up through the app')
  console.log('• The migration script only created Supabase database entries')
  console.log('• Users need to sign up through teyra.app to appear in Clerk')
  console.log('• Once they sign up, their Supabase data will be linked automatically')
  
  console.log('\n🔄 Next Steps:')
  console.log('1. Users need to visit teyra.app and sign up with their emails')
  console.log('2. When they sign up, Clerk will create their account')
  console.log('3. The app will automatically link their Supabase data')
  console.log('4. They will then appear in your Clerk dashboard')
  
  console.log('\n📧 You can:')
  console.log('• Send emails to your migrated users asking them to sign up')
  console.log('• Or manually create Clerk accounts for them (if needed)')
}

checkClerkUsers() 