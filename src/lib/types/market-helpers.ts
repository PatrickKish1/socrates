import { PolymarketMarket } from '@/lib/api/polymarket';
import { KalshiMarket } from '@/lib/api/kalshi';
import { SimmerMarket } from '@/lib/api/simmer';

export type Market = PolymarketMarket | KalshiMarket | SimmerMarket;
export type Provider = 'polymarket' | 'kalshi' | 'simmer';

// Type guards
export function isPolymarketMarket(market: Market): market is PolymarketMarket {
  return 'slug' in market && 'ticker' in market;
}

export function isKalshiMarket(market: Market): market is KalshiMarket {
  return 'event_ticker' in market;
}

export function isSimmerMarket(market: Market): market is SimmerMarket {
  return 'question' in market && 'id' in market && !('event_ticker' in market) && !('slug' in market);
}

// Helper functions to safely get market properties
export function getMarketTitle(market: Market, provider: Provider): string {
  if (provider === 'polymarket' && isPolymarketMarket(market)) {
    return market.title || market.question || 'Market';
  }
  if (provider === 'kalshi' && isKalshiMarket(market)) {
    return market.title || 'Market';
  }
  if (provider === 'simmer' && isSimmerMarket(market)) {
    return market.question || 'Market';
  }
  return 'Market';
}

export function getMarketDescription(market: Market, provider: Provider): string {
  if (provider === 'polymarket' && isPolymarketMarket(market)) {
    return market.description || '';
  }
  if (provider === 'kalshi' && isKalshiMarket(market)) {
    return market.subtitle || '';
  }
  if (provider === 'simmer' && isSimmerMarket(market)) {
    return market.context || market.resolution_criteria || '';
  }
  return '';
}

export function getMarketImage(market: Market, provider: Provider): string | undefined {
  if (provider === 'polymarket' && isPolymarketMarket(market)) {
    return market.image || market.icon || market.imageUrl;
  }
  if (provider === 'kalshi' && isKalshiMarket(market)) {
    return market.image_url;
  }
  if (provider === 'simmer' && isSimmerMarket(market)) {
    return market.image_url || undefined;
  }
  return undefined;
}

