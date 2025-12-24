export interface PolymarketSubMarket {
  id: string;
  question: string;
  slug: string;
  description?: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  volumeNum: number;
  liquidity: string;
  liquidityNum: number;
  endDate: string;
  startDate: string;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  oneDayPriceChange?: number;
  oneHourPriceChange?: number;
  competitive?: number;
  volume24hr?: number;
  resolutionSource?: string;
  groupItemTitle?: string;
  groupItemThreshold?: string;
  active?: boolean;
  closed?: boolean;
  image?: string;
  icon?: string;
}

export interface PolymarketMarket {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  question?: string;
  description?: string;
  image?: string;
  icon?: string;
  imageUrl?: string;
  endDate?: string;
  startDate?: string;
  creationDate?: string;
  resolutionSource?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  featured?: boolean;
  restricted?: boolean;
  liquidity?: number;
  liquidityClob?: number;
  volume?: number;
  volumeNum?: number;
  volume24hr?: number;
  volume1wk?: number;
  volume1mo?: number;
  volume1yr?: number;
  openInterest?: number;
  competitive?: number;
  commentCount?: number;
  markets?: PolymarketSubMarket[];
  tags?: Array<{
    id: string;
    label: string;
    slug: string;
  }>;
  outcomes?: Array<{
    name: string;
    price: number;
    volume?: number;
    marketData?: any;
  }>;
  outcomePrices?: string[];
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  oneDayPriceChange?: number;
  oneHourPriceChange?: number;
}

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

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

export async function fetchPolymarketMarkets(limit = 50): Promise<PolymarketMarket[]> {
  try {
    const baseUrl = getApiBaseUrl();
    // Use Next.js API proxy to avoid CORS issues
    const response = await fetch(
      `${baseUrl}/api/proxy/polymarket?endpoint=events&active=true&closed=false&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch markets: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((market: any) => ({
      id: market.id,
      ticker: market.ticker,
      slug: market.slug,
      title: market.title,
      question: market.title,
      description: market.description,
      image: market.image,
      icon: market.icon,
      imageUrl: market.image || market.icon,
      endDate: market.endDate,
      startDate: market.startDate,
      active: market.active,
      closed: market.closed,
      volume: typeof market.volume === 'number' ? market.volume : parseFloat(market.volume || '0'),
      volumeNum: typeof market.volume === 'number' ? market.volume : parseFloat(market.volume || '0'),
      liquidity: market.liquidity,
      competitive: market.competitive,
      featured: market.featured,
      tags: market.tags || [],
    }));
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return [];
  }
}

export async function fetchPolymarketMarketBySlug(slug: string): Promise<PolymarketMarket | null> {
  try {
    const baseUrl = getApiBaseUrl();
    // Use Next.js API proxy to avoid CORS issues
    const response = await fetch(
      `${baseUrl}/api/proxy/polymarket?endpoint=events/slug/${slug}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch market: ${response.statusText}`);
    }

    const data = await response.json();
    
    const market: PolymarketMarket = {
      id: data.id,
      ticker: data.ticker,
      slug: data.slug,
      title: data.title,
      question: data.title,
      description: data.description,
      image: data.image,
      icon: data.icon,
      imageUrl: data.image || data.icon,
      endDate: data.endDate,
      startDate: data.startDate,
      creationDate: data.creationDate,
      resolutionSource: data.resolutionSource,
      active: data.active,
      closed: data.closed,
      archived: data.archived,
      featured: data.featured,
      restricted: data.restricted,
      liquidity: data.liquidity,
      liquidityClob: data.liquidityClob,
      volume: data.volume,
      volumeNum: typeof data.volume === 'number' ? data.volume : parseFloat(data.volume || '0'),
      volume24hr: data.volume24hr,
      volume1wk: data.volume1wk,
      volume1mo: data.volume1mo,
      volume1yr: data.volume1yr,
      openInterest: data.openInterest,
      competitive: data.competitive,
      commentCount: data.commentCount,
      tags: data.tags?.map((tag: any) => ({
        id: tag.id,
        label: tag.label,
        slug: tag.slug,
      })),
    };

    if (data.markets && Array.isArray(data.markets) && data.markets.length > 0) {
      market.markets = data.markets.map((subMarket: any) => ({
        id: subMarket.id,
        question: subMarket.question,
        slug: subMarket.slug,
        description: subMarket.description,
        outcomes: typeof subMarket.outcomes === 'string' 
          ? JSON.parse(subMarket.outcomes) 
          : subMarket.outcomes || [],
        outcomePrices: typeof subMarket.outcomePrices === 'string'
          ? JSON.parse(subMarket.outcomePrices)
          : subMarket.outcomePrices || [],
        volume: subMarket.volume,
        volumeNum: subMarket.volumeNum || parseFloat(subMarket.volume || '0'),
        liquidity: subMarket.liquidity,
        liquidityNum: subMarket.liquidityNum || parseFloat(subMarket.liquidity || '0'),
        endDate: subMarket.endDate,
        startDate: subMarket.startDate,
        bestBid: subMarket.bestBid,
        bestAsk: subMarket.bestAsk,
        lastTradePrice: subMarket.lastTradePrice,
        oneDayPriceChange: subMarket.oneDayPriceChange,
        oneHourPriceChange: subMarket.oneHourPriceChange,
        competitive: subMarket.competitive,
        volume24hr: subMarket.volume24hr,
        resolutionSource: subMarket.resolutionSource,
        groupItemTitle: subMarket.groupItemTitle,
        groupItemThreshold: subMarket.groupItemThreshold,
        active: subMarket.active,
        closed: subMarket.closed,
        image: subMarket.image,
        icon: subMarket.icon,
      }));

      // Extract outcomes from groupItemTitle (the actual outcome names)
      // Each market in the markets array represents one outcome option
      // Only include ACTIVE markets with groupItemTitle
      market.outcomes = data.markets
        .filter((subMarket: any) => subMarket.groupItemTitle && subMarket.active !== false) // Only active markets with groupItemTitle
        .map((subMarket: any) => {
          const outcomePrices = typeof subMarket.outcomePrices === 'string'
            ? JSON.parse(subMarket.outcomePrices)
            : subMarket.outcomePrices || [];
          // Use the "Yes" price (first price) as the probability for this outcome
          const yesPrice = outcomePrices.length > 0 ? parseFloat(outcomePrices[0] || '0') : 0;
            return {
              name: subMarket.groupItemTitle,
              price: yesPrice,
              // Store full market data for this outcome
              marketData: {
                id: subMarket.id,
                question: subMarket.question,
                description: subMarket.description, // Resolution rules/criteria
                yesPrice: yesPrice,
                noPrice: outcomePrices.length > 1 ? parseFloat(outcomePrices[1] || '0') : 0,
                volume: subMarket.volumeNum || parseFloat(subMarket.volume || '0'),
                liquidity: subMarket.liquidityNum || parseFloat(subMarket.liquidity || '0'),
                bestBid: subMarket.bestBid,
                bestAsk: subMarket.bestAsk,
                lastTradePrice: subMarket.lastTradePrice,
                oneDayPriceChange: subMarket.oneDayPriceChange,
                oneHourPriceChange: subMarket.oneHourPriceChange,
                competitive: subMarket.competitive,
                volume24hr: subMarket.volume24hr,
                startDate: subMarket.startDate,
                endDate: subMarket.endDate,
                active: subMarket.active,
                image: subMarket.image || subMarket.icon,
                resolutionSource: subMarket.resolutionSource,
              },
            };
        });

      // Keep primary market data for backward compatibility
      const primaryMarket = data.markets[0];
      if (primaryMarket) {
        market.outcomePrices = typeof primaryMarket.outcomePrices === 'string'
          ? JSON.parse(primaryMarket.outcomePrices)
          : primaryMarket.outcomePrices || [];
        market.bestBid = primaryMarket.bestBid;
        market.bestAsk = primaryMarket.bestAsk;
        market.lastTradePrice = primaryMarket.lastTradePrice;
        market.oneDayPriceChange = primaryMarket.oneDayPriceChange;
        market.oneHourPriceChange = primaryMarket.oneHourPriceChange;
      }
    } else {
      market.outcomes = data.outcomes || [];
      market.outcomePrices = data.outcomePrices || [];
    }

    return market;
  } catch (error) {
    console.error('Error fetching Polymarket market:', error);
    return null;
  }
}

export function parsePolymarketUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('polymarket.com')) {
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const eventIndex = pathParts.findIndex(part => part === 'event');
      if (eventIndex !== -1 && pathParts[eventIndex + 1]) {
        return pathParts[eventIndex + 1];
      }
      if (pathParts.length > 0 && pathParts[0] !== 'event') {
        return pathParts[pathParts.length - 1];
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing Polymarket URL:', error);
    return null;
  }
}

export async function fetchMarketFromUrl(url: string): Promise<{ market: PolymarketMarket | any | null; provider: 'polymarket' | 'kalshi' | 'simmer' }> {
  const polymarketSlug = parsePolymarketUrl(url);
  
  if (polymarketSlug) {
    const market = await fetchPolymarketMarketBySlug(polymarketSlug);
    return { market, provider: 'polymarket' };
  }
  
  // For Kalshi, dynamically import to avoid circular dependencies
  try {
    const kalshiModule = await import('@/lib/api/kalshi');
    const kalshiTicker = kalshiModule.parseKalshiUrl(url);
    
    if (kalshiTicker) {
      const market = await kalshiModule.fetchKalshiMarketByTicker(kalshiTicker);
      return { market, provider: 'kalshi' };
    }
  } catch (error) {
    console.error('Error importing Kalshi functions:', error);
  }
  
  // For Simmer, dynamically import to avoid circular dependencies
  try {
    const simmerModule = await import('@/lib/api/simmer');
    const simmerId = simmerModule.parseSimmerUrl(url);
    
    if (simmerId) {
      const market = await simmerModule.fetchSimmerMarketById(simmerId);
      return { market, provider: 'simmer' };
    }
  } catch (error) {
    console.error('Error importing Simmer functions:', error);
  }
  
  return { market: null, provider: 'polymarket' };
}

