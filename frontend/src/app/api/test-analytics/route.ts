import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the user agent to see if it's a real browser
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const referer = request.headers.get('referer') || 'Direct'
    
    console.log('🧪 Analytics Test Request:', {
      userAgent,
      referer,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Analytics test endpoint hit',
      timestamp: new Date().toISOString(),
      userAgent: userAgent.substring(0, 100), // Truncate for security
      referer: referer.substring(0, 100)
    })
  } catch (error) {
    console.error('Analytics test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
} 