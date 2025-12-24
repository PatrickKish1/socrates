export interface KalshiMarket {
  event_ticker: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  expiration_time?: string;
  yes_bid?: number;
  no_bid?: number;
  yes_ask?: number;
  no_ask?: number;
  volume?: number;
  open_interest?: number;
  status?: string;
}

const KALSHI_API_BASE = 'https://trading-api.kalshi.com/trade-api/v2';

// Helper to get base URL for API calls
function getApiBaseUrl(): string {
  // In server-side context, use environment variable or default to localhost
  if (typeof window === 'undefined') {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
  }
  // Client-side: use relative URL
  return '';
}

export async function fetchKalshiMarkets(limit = 50): Promise<KalshiMarket[]> {
  try {
    const baseUrl = getApiBaseUrl();
    // Use Next.js API proxy to avoid CORS issues
    const response = await fetch(
      `${baseUrl}/api/proxy/kalshi?endpoint=events&limit=${limit}&status=open`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      // If it's a 401, provide a more helpful error message
      if (response.status === 401) {
        console.warn('Kalshi API requires authentication. Markets will not be available without API credentials.');
        return []; // Return empty array instead of throwing
      }
      throw new Error(`Failed to fetch markets: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return (data.events || []).map((event: any) => ({
      event_ticker: event.event_ticker,
      title: event.title,
      subtitle: event.subtitle,
      image_url: event.image_url,
      expiration_time: event.expiration_time,
      yes_bid: event.yes_bid,
      no_bid: event.no_bid,
      yes_ask: event.yes_ask,
      no_ask: event.no_ask,
      volume: event.volume,
      open_interest: event.open_interest,
      status: event.status,
    }));
  } catch (error) {
    console.error('Error fetching Kalshi markets:', error);
    return [];
  }
}

export async function fetchKalshiMarketByTicker(ticker: string): Promise<KalshiMarket | null> {
  try {
    const baseUrl = getApiBaseUrl();
    // Use Next.js API proxy to avoid CORS issues
    const response = await fetch(
      `${baseUrl}/api/proxy/kalshi?endpoint=events/${ticker}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      // If it's a 401, return null instead of throwing
      if (response.status === 401) {
        console.warn('Kalshi API requires authentication. Market data will not be available without API credentials.');
        return null;
      }
      throw new Error(`Failed to fetch market: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return {
      event_ticker: data.event_ticker,
      title: data.title,
      subtitle: data.subtitle,
      image_url: data.image_url,
      expiration_time: data.expiration_time,
      yes_bid: data.yes_bid,
      no_bid: data.no_bid,
      yes_ask: data.yes_ask,
      no_ask: data.no_ask,
      volume: data.volume,
      open_interest: data.open_interest,
      status: data.status,
    };
  } catch (error) {
    console.error('Error fetching Kalshi market:', error);
    return null;
  }
}

export function parseKalshiUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('kalshi.com')) {
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const marketIndex = pathParts.findIndex(part => part === 'markets');
      if (marketIndex !== -1 && pathParts[marketIndex + 1]) {
        return pathParts[marketIndex + 1];
      }
      if (pathParts.length > 0 && pathParts[0] !== 'markets') {
        return pathParts[pathParts.length - 1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

