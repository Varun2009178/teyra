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
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('🔧 Using APP_URL:', APP_URL);

console.log('🔧 Building Teyra Chrome Extension...');

// Function to replace URLs in any JS file
function replaceAppUrls(content) {
  return content
    .replace(/APP_URL_PLACEHOLDER/g, APP_URL)
    .replace(/https:\/\/teyra\.app/g, APP_URL)
    .replace(/https:\/\/www\.teyra\.app/g, APP_URL);
}

// Read and process popup.js
const popupJsPath = path.join(__dirname, 'popup.js');
let popupJs = fs.readFileSync(popupJsPath, 'utf8');
popupJs = popupJs.replaceAll('SUPABASE_URL_PLACEHOLDER', SUPABASE_URL);
popupJs = popupJs.replaceAll('SUPABASE_ANON_KEY_PLACEHOLDER', SUPABASE_ANON_KEY);
popupJs = replaceAppUrls(popupJs);

// Read and process content.js
const contentJsPath = path.join(__dirname, 'content.js');
let contentJs = fs.readFileSync(contentJsPath, 'utf8');
contentJs = replaceAppUrls(contentJs);

// Read and process background.js
const backgroundJsPath = path.join(__dirname, 'background.js');
let backgroundJs = fs.readFileSync(backgroundJsPath, 'utf8');
backgroundJs = replaceAppUrls(backgroundJs);

// Read and process content-detector.js
const contentDetectorJsPath = path.join(__dirname, 'content-detector.js');
let contentDetectorJs = fs.readFileSync(contentDetectorJsPath, 'utf8');
contentDetectorJs = replaceAppUrls(contentDetectorJs);

// Read and process bridge-listener.js
const bridgeListenerJsPath = path.join(__dirname, 'bridge-listener.js');
let bridgeListenerJs = fs.readFileSync(bridgeListenerJsPath, 'utf8');
bridgeListenerJs = replaceAppUrls(bridgeListenerJs);

// Read and process pro-integration.js
const proIntegrationJsPath = path.join(__dirname, 'pro-integration.js');
let proIntegrationJs = fs.readFileSync(proIntegrationJsPath, 'utf8');
proIntegrationJs = replaceAppUrls(proIntegrationJs);

// Create build directory
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir);
}

// Copy all files to build directory (except JS files that need URL processing)
const filesToCopy = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'calendar.js',
  'supabase.js',
  'analytics.js',
  'teyra-logo-64kb.png',
  'Happy.gif',
  'Neutral Calm.gif',
  'Sad With Tears 2.gif'
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

// Write all processed JS files
fs.writeFileSync(path.join(buildDir, 'popup.js'), popupJs);
console.log('✅ Built popup.js with environment variables');

fs.writeFileSync(path.join(buildDir, 'content.js'), contentJs);
console.log('✅ Built content.js with APP_URL');

fs.writeFileSync(path.join(buildDir, 'background.js'), backgroundJs);
console.log('✅ Built background.js with APP_URL');

fs.writeFileSync(path.join(buildDir, 'content-detector.js'), contentDetectorJs);
console.log('✅ Built content-detector.js with APP_URL');

fs.writeFileSync(path.join(buildDir, 'bridge-listener.js'), bridgeListenerJs);
console.log('✅ Built bridge-listener.js with APP_URL');

fs.writeFileSync(path.join(buildDir, 'pro-integration.js'), proIntegrationJs);
console.log('✅ Built pro-integration.js with APP_URL');

console.log('🎉 Extension built successfully in ./build directory');
console.log('📁 Load the ./build directory in Chrome to test the extension');