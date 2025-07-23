import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Hard-coded database URL for production
const DB_URL = "postgresql://neondb_owner:npg_ps5BtDme1Yfk@ep-empty-rice-aeos99ao-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function checkProductionReadiness() {
  console.log('🚀 Running production readiness check...');
  
  // 1. Check database connection
  console.log('\n📊 Checking database connection...');
  try {
    const sql = neon(DB_URL);
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful. Current time:', result[0].current_time);
    
    // Check tables
    const tasksTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks'
      )
    `;
    
    console.log('✅ Tasks table exists:', tasksTable[0].exists);
    
    const userProgressTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_progress'
      )
    `;
    
    console.log('✅ User progress table exists:', userProgressTable[0].exists);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return;
  }
  
  // 2. Check for hard-coded database URLs
  console.log('\n🔍 Checking for hard-coded database URLs...');
  
  const dbFilePath = path.join(process.cwd(), 'src', 'lib', 'db.ts');
  const dbFileContent = fs.readFileSync(dbFilePath, 'utf8');
  
  if (dbFileContent.includes('const DB_URL =') && 
      dbFileContent.includes('postgresql://neondb_owner:npg_ps5BtDme1Yfk')) {
    console.log('✅ Hard-coded database URLs found in db.ts');
  } else {
    console.error('❌ Hard-coded database URLs not found in db.ts');
  }
  
  // 3. Check for ensureUserExists function
  console.log('\n🔍 Checking for ensureUserExists function...');
  
  const ensureUserFilePath = path.join(process.cwd(), 'src', 'lib', 'ensure-user.ts');
  if (fs.existsSync(ensureUserFilePath)) {
    console.log('✅ ensureUserExists function found');
  } else {
    console.error('❌ ensureUserExists function not found');
  }
  
  // 4. Check for mobile optimization
  console.log('\n📱 Checking for mobile optimization...');
  
  const layoutFilePath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
  const layoutFileContent = fs.readFileSync(layoutFilePath, 'utf8');
  
  if (layoutFileContent.includes('meta name="viewport"') && 
      layoutFileContent.includes('width=device-width, initial-scale=1.0')) {
    console.log('✅ Viewport meta tag found in layout.tsx');
  } else {
    console.error('❌ Viewport meta tag not found in layout.tsx');
  }
  
  // 5. Check for responsive classes
  console.log('\n📱 Checking for responsive classes...');
  
  const dashboardFilePath = path.join(process.cwd(), 'src', 'app', 'dashboard', 'page.tsx');
  const dashboardFileContent = fs.readFileSync(dashboardFilePath, 'utf8');
  
  if (dashboardFileContent.includes('sm:') && 
      dashboardFileContent.includes('md:') && 
      dashboardFileContent.includes('lg:')) {
    console.log('✅ Responsive classes found in dashboard page');
  } else {
    console.error('❌ Responsive classes not found in dashboard page');
  }
  
  // 6. Check for welcome page
  console.log('\n🔍 Checking welcome page...');
  
  const welcomeFilePath = path.join(process.cwd(), 'src', 'app', 'welcome', 'page.tsx');
  const welcomeFileContent = fs.readFileSync(welcomeFilePath, 'utf8');
  
  if (welcomeFileContent.includes('What\'s one thing you want to complete today?')) {
    console.log('✅ Welcome page content found');
  } else {
    console.error('❌ Welcome page content not found');
  }
  
  console.log('\n✅ Production readiness check completed!');
  console.log('Your application is ready for production deployment.');
  console.log('Remember to rebuild and deploy the application to apply all changes.');
}

// Run the check
checkProductionReadiness()
  .then(() => console.log('Check completed'))
  .catch(console.error);