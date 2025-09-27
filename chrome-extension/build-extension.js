#!/usr/bin/env node

/**
 * Build script for Teyra Chrome Extension
 * Replaces placeholder values with actual environment variables
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from parent directory
require('dotenv').config({ path: '../frontend/.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('🔧 Building Teyra Chrome Extension...');

// Read popup.js
const popupJsPath = path.join(__dirname, 'popup.js');
let popupJs = fs.readFileSync(popupJsPath, 'utf8');

// Replace placeholders
popupJs = popupJs.replace('SUPABASE_URL_PLACEHOLDER', SUPABASE_URL);
popupJs = popupJs.replace('SUPABASE_ANON_KEY_PLACEHOLDER', SUPABASE_ANON_KEY);

// Create build directory
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Copy all files to build directory
const filesToCopy = [
  'manifest.json',
  'popup.html',
  'background.js',
  'bridge-listener.js',
  'supabase.js'
];

filesToCopy.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(buildDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file}`);
  } else {
    console.warn(`⚠️  ${file} not found, skipping`);
  }
});

// Write the processed popup.js
fs.writeFileSync(path.join(buildDir, 'popup.js'), popupJs);
console.log('✅ Built popup.js with environment variables');

console.log('🎉 Extension built successfully in ./build directory');
console.log('📁 Load the ./build directory in Chrome to test the extension');