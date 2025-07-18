import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function sendTestEmail() {
  const testEmail = process.env.TEST_EMAIL || 'your-email@example.com'
  
  if (!testEmail || testEmail === 'your-email@example.com') {
    console.error('❌ Please set TEST_EMAIL in your .env.local file')
    console.log('Example: TEST_EMAIL=your-email@gmail.com')
    process.exit(1)
  }

  console.log('🧪 Sending test email to:', testEmail)
  
  try {
    const response = await fetch('http://localhost:3000/api/test-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        name: 'Test User'
      }),
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Test email sent successfully!')
      console.log('📧 Check your inbox for the test email')
      console.log('📊 Response:', result)
    } else {
      console.error('❌ Failed to send test email:', result)
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error)
  }
}

sendTestEmail() 