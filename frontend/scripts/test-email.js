import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testEmailFunction(testEmail) {
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    console.log('Please add your Resend API key to .env.local:');
    console.log('RESEND_API_KEY=re_your_key_here');
    return;
  }

  console.log('🧪 Testing email system...');
  console.log('📧 Resend API Key found:', process.env.RESEND_API_KEY.substring(0, 10) + '...');

  const emailBody = `
Hey there!

This is a test of the Teyra 24-hour reset email system! 🚀

📊 **Yesterday's Summary:**
Total Tasks: 5
Completed: 3
Remaining: 2

✅ **What You Accomplished:**
✅ Complete project proposal
✅ Review meeting notes  
✅ Update dashboard

⏸️ **What's Still Pending:**
⏸️ Call client
⏸️ Send invoice

🤖 **AI Mood & Learning System Reset:**
Your AI companion has analyzed your patterns and is ready to provide even better suggestions!

Ready to make today even better? Let's go! 💪

Keep growing! 🌱
The Teyra Team
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Teyra Test <noreply@resend.dev>', // Use resend.dev for testing
        to: [testEmail],
        subject: '🧪 Test - Daily Reset Complete!',
        text: emailBody,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin: 0;">🧪 Test Email - Daily Reset Complete!</h1>
            </div>
            <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${emailBody.split('\n').map(line => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return `<h3 style="color: #1f2937; margin: 15px 0 10px 0;">${line.replace(/\*\*/g, '')}</h3>`;
                } else if (line.startsWith('✅') || line.startsWith('⏸️')) {
                  return `<p style="margin: 5px 0; padding-left: 20px; font-family: monospace;">${line}</p>`;
                } else if (line.trim() === '') {
                  return '<br>';
                } else {
                  return `<p style="margin: 10px 0; line-height: 1.5;">${line}</p>`;
                }
              }).join('')}
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="http://localhost:3000/dashboard" 
                 style="background: linear-gradient(45deg, #3b82f6, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Open Teyra Dashboard 🚀
              </a>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
              <p>This is a test email from your development environment.<br>Keep growing! 🌱</p>
            </div>
          </div>
        `
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test email sent successfully!');
      console.log('📬 Email ID:', result.id);
      console.log(`📧 Check your inbox at ${testEmail}`);
      console.log('\n🎯 If you received the email, the system is working correctly!');
    } else {
      const error = await response.text();
      console.error('❌ Failed to send test email:');
      console.error('Status:', response.status);
      console.error('Error:', error);
      
      if (response.status === 422) {
        console.log('\n💡 Tip: Make sure to replace testEmail with your actual email address in the script');
      }
    }
    
  } catch (error) {
    console.error('❌ Email sending error:', error);
  }
}

// Get email from command line
const emailArg = process.argv[2] || 'YOUR_EMAIL@example.com';

if (emailArg === 'YOUR_EMAIL@example.com') {
  console.log('❌ Please provide your email address:');
  console.log('node scripts/test-email.js your.email@gmail.com');
} else {
  testEmailFunction(emailArg);
}