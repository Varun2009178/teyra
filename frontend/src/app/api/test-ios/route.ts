import { NextResponse } from 'next/server';

// Simple test endpoint to verify deployments are working
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'iOS test endpoint is working!',
    timestamp: new Date().toISOString(),
    deployment: 'live'
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'POST request received!',
    timestamp: new Date().toISOString(),
    deployment: 'live'
  });
}

