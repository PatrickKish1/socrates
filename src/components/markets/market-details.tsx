'use client';

import { useState, useEffect } from 'react';
import { fetchPolymarketMarketBySlug, PolymarketMarket } from '@/lib/api/polymarket';
import { fetchKalshiMarketByTicker, KalshiMarket } from '@/lib/api/kalshi';
import { fetchSimmerMarketById, SimmerMarket } from '@/lib/api/simmer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ExternalLink, ChevronLeft } from 'lucide-react';
import { AISignal } from '@/components/ai/ai-signal';
import Image from 'next/image';
import Link from 'next/link';

interface MarketDetailsProps {
  provider: 'polymarket' | 'kalshi' | 'simmer';
  slug: string;
}

export function MarketDetails({ provider, slug }: MarketDetailsProps) {
  const [market, setMarket] = useState<PolymarketMarket | KalshiMarket | SimmerMarket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarket() {
      setLoading(true);
      try {
        if (provider === 'polymarket') {
          const marketData = await fetchPolymarketMarketBySlug(slug);
          setMarket(marketData);
        } else if (provider === 'kalshi') {
          const marketData = await fetchKalshiMarketByTicker(slug);
          setMarket(marketData);
        } else if (provider === 'simmer') {
          const marketData = await fetchSimmerMarketById(slug);
          setMarket(marketData);
        }
      } catch (error) {
        console.error('Error loading market:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMarket();
  }, [provider, slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Market not found</p>
      </div>
    );
  }

  const isPolymarket = provider === 'polymarket';
  const isKalshi = provider === 'kalshi';
  const isSimmer = provider === 'simmer';
  
  const polymarketMarket = isPolymarket ? market as PolymarketMarket : null;
  const kalshiMarket = isKalshi ? market as KalshiMarket : null;
  const simmerMarket = isSimmer ? market as SimmerMarket : null;

  const question = isPolymarket 
    ? polymarketMarket?.title || polymarketMarket?.question || 'No question available'
    : isKalshi
    ? kalshiMarket?.title || 'No title available'
    : simmerMarket?.question || 'No question available';

  const description = isPolymarket
    ? polymarketMarket?.description
    : isKalshi
    ? kalshiMarket?.subtitle
    : simmerMarket?.context || simmerMarket?.resolution_criteria;

  const imageUrl = isPolymarket 
    ? polymarketMarket?.image || polymarketMarket?.icon || polymarketMarket?.imageUrl
    : isKalshi
    ? kalshiMarket?.image_url
    : simmerMarket?.image_url || undefined;

  // Get all outcomes for display
  let outcomes: Array<{ 
    name: string; 
    price: number; 
    chance: number;
    yesPrice?: number;
    noPrice?: number;
    volume?: number;
    liquidity?: number;
    bestBid?: number;
    bestAsk?: number;
    lastTradePrice?: number;
    oneDayPriceChange?: number;
    active?: boolean;
    image?: string;
  }> = [];

  if (isPolymarket && polymarketMarket) {
    // Polymarket: Extract outcomes from markets array using groupItemTitle
    // Only show ACTIVE markets
    if (polymarketMarket.markets && polymarketMarket.markets.length > 0) {
      outcomes = polymarketMarket.markets
        .filter((subMarket) => subMarket.groupItemTitle && subMarket.active !== false) // Only active markets
        .map((subMarket) => {
          const outcomePrices = Array.isArray(subMarket.outcomePrices)
            ? subMarket.outcomePrices
            : typeof subMarket.outcomePrices === 'string'
            ? JSON.parse(subMarket.outcomePrices)
            : [];
          
          const yesPrice = outcomePrices.length > 0 ? parseFloat(outcomePrices[0] || '0') : 0;
          const noPrice = outcomePrices.length > 1 ? parseFloat(outcomePrices[1] || '0') : 0;
          
          return {
            name: subMarket.groupItemTitle || 'Unknown',
            price: yesPrice, // Use Yes price as the main probability
            chance: yesPrice * 100,
            yesPrice,
            noPrice,
            volume: subMarket.volumeNum || 0,
            liquidity: subMarket.liquidityNum || 0,
            bestBid: subMarket.bestBid,
            bestAsk: subMarket.bestAsk,
            lastTradePrice: subMarket.lastTradePrice,
            oneDayPriceChange: subMarket.oneDayPriceChange,
            active: subMarket.active,
            image: subMarket.image || subMarket.icon,
          };
        });
    } else if (polymarketMarket.outcomes && polymarketMarket.outcomes.length > 0) {
      // Fallback: Use outcomes array directly if markets array is not available
      outcomes = polymarketMarket.outcomes.map((outcome: any) => {
        if (typeof outcome === 'object' && outcome !== null && 'name' in outcome) {
          return {
            name: outcome.name,
            price: outcome.price || 0,
            chance: (outcome.price || 0) * 100,
          };
        } else {
          return {
            name: String(outcome),
            price: 0,
            chance: 0,
          };
        }
      });
    }
  } else if (kalshiMarket) {
    // Kalshi is typically Yes/No
    const yesPrice = kalshiMarket.yes_bid || 0;
    const noPrice = kalshiMarket.no_bid || 0;
    outcomes = [
      {
        name: 'Yes',
        price: yesPrice,
        chance: yesPrice * 100,
        yesPrice,
        noPrice,
      },
      {
        name: 'No',
        price: noPrice,
        chance: noPrice * 100,
        yesPrice,
        noPrice,
      },
    ];
  } else if (isSimmer && simmerMarket) {
    // Simmer uses probability (0-1) for Yes, and 1 - probability for No
    const yesPrice = simmerMarket.probability || 0;
    const noPrice = 1 - (simmerMarket.probability || 0);
    outcomes = [
      {
        name: 'Yes',
        price: yesPrice,
        chance: yesPrice * 100,
        yesPrice,
        noPrice,
        volume: simmerMarket.total_volume || 0,
      },
      {
        name: 'No',
        price: noPrice,
        chance: noPrice * 100,
        yesPrice,
        noPrice,
        volume: simmerMarket.total_volume || 0,
      },
    ];
  }

  const volume = isPolymarket
    ? polymarketMarket?.volumeNum || polymarketMarket?.volume || 0
    : isKalshi
    ? kalshiMarket?.volume || 0
    : simmerMarket?.total_volume || 0;

  // For backward compatibility, calculate yes/no prices if outcomes exist
  let yesPrice = 0;
  let noPrice = 0;
  if (outcomes.length >= 2) {
    // Check if first two outcomes are Yes/No
    const firstOutcome = outcomes[0]?.name?.toLowerCase();
    const secondOutcome = outcomes[1]?.name?.toLowerCase();
    if (firstOutcome === 'yes' || firstOutcome === 'true') {
      yesPrice = outcomes[0].price;
      noPrice = outcomes[1].price;
    } else {
      // Not a Yes/No market, use first outcome as reference
      yesPrice = outcomes[0].price;
      noPrice = outcomes.length > 1 ? outcomes[1].price : 0;
    }
  }

  const yesChance = yesPrice * 100;
  const noChance = noPrice * 100;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Link
        href="/markets"
        className="inline-flex items-center gap-2 text-sm sm:text-base font-mono hover:underline transition-colors mb-2 sm:mb-4"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        Back to Markets
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <Badge className="mb-2 text-xs sm:text-sm">
            {provider === 'polymarket' ? 'POLY' : provider === 'kalshi' ? 'KALSHI' : 'SIMMER'}
          </Badge>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-mono">{question}</h1>
          {description && (
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">{description}</p>
          )}
        </div>
      </div>

      {imageUrl && (
        <div className="relative w-full h-64 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={question}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            className="object-cover"
            loading="eager"
          />
        </div>
      )}

      {/* External Link */}
      <div className="flex items-center gap-2">
        <Link
          href={
            isPolymarket
              ? `https://polymarket.com/event/${polymarketMarket?.slug}`
              : isKalshi
              ? `https://kalshi.com/markets/${kalshiMarket?.event_ticker}`
              : simmerMarket?.kalshi_url || simmerMarket?.polymarket_url || `https://simmer.markets/markets/${simmerMarket?.id}` || '#'
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="font-mono">
            <ExternalLink className="w-4 h-4 mr-2" />
            View on {isPolymarket ? 'Polymarket' : isKalshi ? 'Kalshi' : 'Simmer'}
          </Button>
        </Link>
      </div>

      {/* Outcomes Display */}
      {outcomes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Market Outcomes</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Current pricing for all possible outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${outcomes.length === 2 ? 'grid-cols-2' : outcomes.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
              {outcomes.map((outcome, index) => {
                const isYes = outcome.name.toLowerCase() === 'yes' || outcome.name.toLowerCase() === 'true';
                const isNo = outcome.name.toLowerCase() === 'no' || outcome.name.toLowerCase() === 'false';
                const borderColor = isYes ? 'border-green-500' : isNo ? 'border-red-500' : 'border-blue-500';
                const bgColor = isYes ? 'bg-green-500/10' : isNo ? 'bg-red-500/10' : 'bg-blue-500/10';
                const textColor = isYes ? 'text-green-500' : isNo ? 'text-red-500' : 'text-blue-500';
                
                return (
                  <div
                    key={`${outcome.name}-${index}`}
                    className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor}`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {outcome.image && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={outcome.image}
                            alt={outcome.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground mb-1">
                          {outcome.name}
                        </div>
                        <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${textColor}`}>
                          {outcome.chance.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    {outcome.yesPrice !== undefined && outcome.noPrice !== undefined && (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Yes:</span>
                          <span className="text-green-500 font-medium">${(outcome.yesPrice * 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">No:</span>
                          <span className="text-red-500 font-medium">${(outcome.noPrice * 100).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    {outcome.volume !== undefined && outcome.volume > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Vol: ${outcome.volume.toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isPolymarket && polymarketMarket?.tags && polymarketMarket.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {polymarketMarket.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.label}
            </Badge>
          ))}
        </div>
      )}
      {isSimmer && simmerMarket?.tags && simmerMarket.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {simmerMarket.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Market Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm sm:text-base">Yes Price</span>
            <span className="font-bold text-green-500 text-sm sm:text-base">{yesChance.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm sm:text-base">No Price</span>
            <span className="font-bold text-red-500 text-sm sm:text-base">{noChance.toFixed(2)}%</span>
          </div>
          {isPolymarket && polymarketMarket?.bestBid && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm sm:text-base">Best Bid</span>
              <span className="font-bold text-sm sm:text-base">{(polymarketMarket.bestBid * 100).toFixed(2)}%</span>
            </div>
          )}
          {isPolymarket && polymarketMarket?.bestAsk && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm sm:text-base">Best Ask</span>
              <span className="font-bold text-sm sm:text-base">{(polymarketMarket.bestAsk * 100).toFixed(2)}%</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm sm:text-base">Volume</span>
            <span className="font-bold text-sm sm:text-base">${volume.toLocaleString()}</span>
          </div>
          {isPolymarket && polymarketMarket?.volume24hr && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm sm:text-base">24h Volume</span>
              <span className="font-bold text-sm sm:text-base">${polymarketMarket.volume24hr.toLocaleString()}</span>
            </div>
          )}
          {isPolymarket && polymarketMarket?.liquidity && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm sm:text-base">Liquidity</span>
              <span className="font-bold text-sm sm:text-base">${polymarketMarket.liquidity.toLocaleString()}</span>
            </div>
          )}
          {isPolymarket && polymarketMarket?.competitive && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm sm:text-base">Competitive Score</span>
              <span className="font-bold text-sm sm:text-base">{(polymarketMarket.competitive * 100).toFixed(2)}%</span>
            </div>
          )}
          {isPolymarket && polymarketMarket?.endDate && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm sm:text-base">End Date</span>
              <span className="font-bold text-sm sm:text-base">{new Date(polymarketMarket.endDate).toLocaleDateString()}</span>
            </div>
          )}
          {isSimmer && simmerMarket?.resolves_at && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm sm:text-base">Resolves At</span>
              <span className="font-bold text-sm sm:text-base">{new Date(simmerMarket.resolves_at).toLocaleDateString()}</span>
            </div>
          )}
          {isSimmer && simmerMarket?.status && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm sm:text-base">Status</span>
              <Badge variant={simmerMarket.status === 'active' ? 'default' : 'secondary'} className="text-sm sm:text-base">
                {simmerMarket.status.toUpperCase()}
              </Badge>
            </div>
          )}
          {isSimmer && simmerMarket?.resolution_criteria && (
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-sm sm:text-base">Resolution Criteria</span>
              <span className="font-medium text-sm sm:text-base">{simmerMarket.resolution_criteria}</span>
            </div>
          )}
          {isPolymarket && polymarketMarket?.oneDayPriceChange !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm sm:text-base">24h Price Change</span>
              <span className={`font-bold text-sm sm:text-base ${polymarketMarket.oneDayPriceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(polymarketMarket.oneDayPriceChange * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            AI Analysis
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Get AI-powered prediction and analysis for this market
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AISignal market={market} provider={provider} />
        </CardContent>
      </Card>
    </div>
  );
}

