import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Function to execute shell commands
function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`Warning: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

async function simulateProduction() {
  try {
    console.log('🚀 Setting up production simulation...');
    
    // 1. Build the Next.js app
    console.log('\n📦 Building Next.js app...');
    await executeCommand('npm run build');
    
    // 2. Start the app in production mode
    console.log('\n🌐 Starting app in production mode...');
    console.log('Open http://localhost:3000 in your browser to test');
    console.log('Press Ctrl+C to stop the server');
    
    // Execute the start command (this will block until terminated)
    await executeCommand('npm start');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the simulation
simulateProduction();