'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, TrendingUp, Sparkles } from 'lucide-react';
import { PolymarketMarket } from '@/lib/api/polymarket';
import { KalshiMarket } from '@/lib/api/kalshi';
import { SimmerMarket } from '@/lib/api/simmer';
import { PolymarketLogo, KalshiLogo, SimmerLogo } from './provider-logos';

interface MarketCardProps {
  market: PolymarketMarket | KalshiMarket | SimmerMarket;
  provider: 'polymarket' | 'kalshi' | 'simmer';
}

export function MarketCard({ market, provider }: MarketCardProps) {
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

  const imageUrl = isPolymarket 
    ? polymarketMarket?.image || polymarketMarket?.icon || polymarketMarket?.imageUrl
    : isKalshi
    ? kalshiMarket?.image_url
    : simmerMarket?.image_url || undefined;

  let yesPrice = 0;
  let noPrice = 0;

  if (isPolymarket && polymarketMarket) {
    if (polymarketMarket.outcomes && polymarketMarket.outcomes.length >= 2) {
      yesPrice = polymarketMarket.outcomes[0]?.price || 0;
      noPrice = polymarketMarket.outcomes[1]?.price || 0;
    } else if (polymarketMarket.outcomePrices && polymarketMarket.outcomePrices.length >= 2) {
      yesPrice = parseFloat(polymarketMarket.outcomePrices[0] || '0');
      noPrice = parseFloat(polymarketMarket.outcomePrices[1] || '0');
    }
  } else if (isKalshi && kalshiMarket) {
    yesPrice = kalshiMarket.yes_bid || 0;
    noPrice = kalshiMarket.no_bid || 0;
  } else if (isSimmer && simmerMarket) {
    // Simmer uses probability (0-1) for Yes, and 1 - probability for No
    yesPrice = simmerMarket.probability || 0;
    noPrice = 1 - (simmerMarket.probability || 0);
  }

  const volume = isPolymarket
    ? polymarketMarket?.volumeNum || polymarketMarket?.volume || 0
    : isKalshi
    ? kalshiMarket?.volume || 0
    : simmerMarket?.total_volume || 0;

  const marketSlug = isPolymarket
    ? polymarketMarket?.slug || ''
    : isKalshi
    ? kalshiMarket?.event_ticker || ''
    : simmerMarket?.id || '';

  const marketUrl = isPolymarket
    ? `/markets/polymarket/${marketSlug}`
    : isKalshi
    ? `/markets/kalshi/${marketSlug}`
    : `/markets/simmer/${marketSlug}`;

  const yesChance = yesPrice * 100;
  const noChance = noPrice * 100;
  const dominantChance = yesChance > noChance ? yesChance : noChance;
  const isYesDominant = yesChance > noChance;
  const hasValidPrices = (yesPrice > 0 || noPrice > 0);

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) {
      return `$${(vol / 1000000).toFixed(1)}m`;
    } else if (vol >= 1000) {
      return `$${(vol / 1000).toFixed(1)}k`;
    }
    return `$${vol.toFixed(0)}`;
  };

  const ProviderLogo = isPolymarket 
    ? PolymarketLogo 
    : isKalshi 
    ? KalshiLogo 
    : SimmerLogo;

  return (
    <Card className="relative overflow-hidden border-2 border-black dark:border-white hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {imageUrl && (
          <div className="relative w-full h-48">
            <Image
              src={imageUrl}
              alt={question}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover"
            />
            <div className="absolute top-2 right-2 bg-black/80 dark:bg-white/80 backdrop-blur-sm rounded px-2 py-1">
              <ProviderLogo className="h-5 w-auto text-white dark:text-black" />
            </div>
          </div>
        )}
        <CardHeader className="flex-1">
          <div className="flex items-center justify-between mb-2">
            {hasValidPrices && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isYesDominant ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-bold">
                  {dominantChance.toFixed(0)}% Chance
                </span>
              </div>
            )}
            {!imageUrl && (
              <div className="ml-auto">
                <ProviderLogo className="h-5 w-auto text-foreground" />
              </div>
            )}
          </div>
          <h3 className="font-semibold text-lg line-clamp-2">{question}</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href={marketUrl} className="block">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Get Signal
            </Button>
          </Link>
        </CardContent>
        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>{formatVolume(volume)} Vol</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>330</span>
          </div>
        </CardFooter>
      </Card>
  );
}

