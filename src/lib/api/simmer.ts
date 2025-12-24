export interface SimmerMarket {
  id: string;
  question: string;
  context?: string;
  resolution_criteria?: string;
  status: 'initializing' | 'active' | 'resolved' | 'disputed' | 'cancelled';
  probability: number;
  confidence_score?: number | null;
  liquidity_param?: number;
  shares_yes?: number;
  shares_no?: number;
  timeline_days?: number;
  created_at: string;
  resolves_at: string;
  resolved_at?: string | null;
  outcome?: boolean | null;
  resolution_confidence?: number | null;
  resolution_reasoning?: string | null;
  cycle?: number;
  next_check_at?: string;
  initial_probability?: number;
  total_volume?: number;
  current_probability?: number;
  source_urls?: string[];
  creator_points_earned?: number;
  resolution_hint_count?: number;
  is_imported?: boolean;
  import_source?: 'kalshi' | 'polymarket' | null;
  polymarket_url?: string | null;
  kalshi_ticker?: string | null;
  kalshi_event_ticker?: string | null;
  kalshi_url?: string | null;
  image_url?: string | null;
  external_price_yes?: number | null;
  external_price_no?: number | null;
  divergence?: number | null;
  tags?: string[];
  user_flagged?: boolean;
  user_flag_reason?: string | null;
  x402_feed_id?: string | null;
  agent_wallet_address?: string | null;
  creator_wallet_address?: string | null;
}

const SIMMER_API_BASE = 'https://api.simmer.markets/api';

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

export async function fetchSimmerMarkets(limit = 200): Promise<SimmerMarket[]> {
  try {
    const baseUrl = getApiBaseUrl();
    // Use Next.js API proxy to avoid CORS issues
    const response = await fetch(
      `${baseUrl}/api/proxy/simmer?endpoint=markets&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Failed to fetch markets: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return (data.markets || [])
      .filter((market: any) => market.status === 'active') // Only show active markets (exclude resolved, cancelled, disputed, initializing)
      .map((market: any) => ({
      id: market.id,
      question: market.question,
      context: market.context,
      resolution_criteria: market.resolution_criteria,
      status: market.status,
      probability: market.probability,
      confidence_score: market.confidence_score,
      liquidity_param: market.liquidity_param,
      shares_yes: market.shares_yes,
      shares_no: market.shares_no,
      timeline_days: market.timeline_days,
      created_at: market.created_at,
      resolves_at: market.resolves_at,
      resolved_at: market.resolved_at,
      outcome: market.outcome,
      resolution_confidence: market.resolution_confidence,
      resolution_reasoning: market.resolution_reasoning,
      cycle: market.cycle,
      next_check_at: market.next_check_at,
      initial_probability: market.initial_probability,
      total_volume: market.total_volume,
      current_probability: market.current_probability,
      source_urls: market.source_urls,
      creator_points_earned: market.creator_points_earned,
      resolution_hint_count: market.resolution_hint_count,
      is_imported: market.is_imported,
      import_source: market.import_source,
      polymarket_url: market.polymarket_url,
      kalshi_ticker: market.kalshi_ticker,
      kalshi_event_ticker: market.kalshi_event_ticker,
      kalshi_url: market.kalshi_url,
      image_url: market.image_url,
      external_price_yes: market.external_price_yes,
      external_price_no: market.external_price_no,
      divergence: market.divergence,
      tags: market.tags,
      user_flagged: market.user_flagged,
      user_flag_reason: market.user_flag_reason,
      x402_feed_id: market.x402_feed_id,
      agent_wallet_address: market.agent_wallet_address,
      creator_wallet_address: market.creator_wallet_address,
    }));
  } catch (error) {
    console.error('Error fetching Simmer markets:', error);
    return [];
  }
}

export async function fetchSimmerMarketById(id: string): Promise<SimmerMarket | null> {
  try {
    const baseUrl = getApiBaseUrl();
    // Use Next.js API proxy to avoid CORS issues
    const response = await fetch(
      `${baseUrl}/api/proxy/simmer?endpoint=markets/${id}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Failed to fetch market: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      question: data.question,
      context: data.context,
      resolution_criteria: data.resolution_criteria,
      status: data.status,
      probability: data.probability,
      confidence_score: data.confidence_score,
      liquidity_param: data.liquidity_param,
      shares_yes: data.shares_yes,
      shares_no: data.shares_no,
      timeline_days: data.timeline_days,
      created_at: data.created_at,
      resolves_at: data.resolves_at,
      resolved_at: data.resolved_at,
      outcome: data.outcome,
      resolution_confidence: data.resolution_confidence,
      resolution_reasoning: data.resolution_reasoning,
      cycle: data.cycle,
      next_check_at: data.next_check_at,
      initial_probability: data.initial_probability,
      total_volume: data.total_volume,
      current_probability: data.current_probability,
      source_urls: data.source_urls,
      creator_points_earned: data.creator_points_earned,
      resolution_hint_count: data.resolution_hint_count,
      is_imported: data.is_imported,
      import_source: data.import_source,
      polymarket_url: data.polymarket_url,
      kalshi_ticker: data.kalshi_ticker,
      kalshi_event_ticker: data.kalshi_event_ticker,
      kalshi_url: data.kalshi_url,
      image_url: data.image_url,
      external_price_yes: data.external_price_yes,
      external_price_no: data.external_price_no,
      divergence: data.divergence,
      tags: data.tags,
      user_flagged: data.user_flagged,
      user_flag_reason: data.user_flag_reason,
      x402_feed_id: data.x402_feed_id,
      agent_wallet_address: data.agent_wallet_address,
      creator_wallet_address: data.creator_wallet_address,
    };
  } catch (error) {
    console.error('Error fetching Simmer market:', error);
    return null;
  }
}

export function parseSimmerUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('simmer.markets')) {
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const marketIndex = pathParts.findIndex(part => part === 'markets');
      if (marketIndex !== -1 && pathParts[marketIndex + 1]) {
        return pathParts[marketIndex + 1];
      }
      // Also check if the path directly contains a market ID (UUID format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (const part of pathParts) {
        if (uuidRegex.test(part)) {
          return part;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

