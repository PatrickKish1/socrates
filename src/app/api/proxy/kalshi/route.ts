import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const KALSHI_API_BASE = 'https://trading-api.kalshi.com/trade-api/v2';

// Helper function to generate HMAC signature for Kalshi API
function generateKalshiSignature(
  method: string,
  path: string,
  timestamp: string,
  body: string,
  secret: string
): string {
  const message = `${method}\n${path}\n${timestamp}\n${body}`;
  return crypto.createHmac('sha256', secret).update(message).digest('base64');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint') || 'events';
    const params = new URLSearchParams();
    
    // Forward query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        params.append(key, value);
      }
    });

    const path = `/${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
    const url = `${KALSHI_API_BASE}${path}`;

    // Kalshi API requires authentication headers
    const KALSHI_API_KEY = process.env.KALSHI_API_KEY;
    const KALSHI_API_SECRET = process.env.KALSHI_API_SECRET;

    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // If API credentials are available, add authentication headers
    if (KALSHI_API_KEY && KALSHI_API_SECRET) {
      const timestamp = Date.now().toString();
      const signature = generateKalshiSignature('GET', path, timestamp, '', KALSHI_API_SECRET);
      
      headers['KALSHI-ACCESS-KEY'] = KALSHI_API_KEY;
      headers['KALSHI-ACCESS-TIMESTAMP'] = timestamp;
      headers['KALSHI-ACCESS-SIGNATURE'] = signature;
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      // If 401, provide helpful error message
      if (response.status === 401) {
        console.error('Kalshi API 401: Authentication required');
        return NextResponse.json(
          { 
            error: 'Kalshi API requires authentication',
            status: 401,
            message: 'The Kalshi API requires authenticated requests. Please configure KALSHI_API_KEY and KALSHI_API_SECRET environment variables. See https://kalshi-b198743e.mintlify.app/getting_started/quick_start_authenticated_requests for details.',
            requiresAuth: true
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to fetch: ${response.statusText}`, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Kalshi proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

