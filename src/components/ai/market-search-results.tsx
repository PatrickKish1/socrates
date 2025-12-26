'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PolymarketLogo, KalshiLogo, SimmerLogo } from '@/components/markets/provider-logos';

interface SearchResult {
  provider: 'polymarket' | 'kalshi' | 'simmer';
  id: string;
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  url: string;
  relevanceScore?: number;
}

interface MarketSearchResultsProps {
  results: SearchResult[];
  onSelectMarket?: (result: SearchResult) => void;
  onAnalyzeAll?: () => void;
}

export function MarketSearchResults({ results, onSelectMarket, onAnalyzeAll }: MarketSearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  const getProviderLogo = (provider: 'polymarket' | 'kalshi' | 'simmer') => {
    switch (provider) {
      case 'polymarket':
        return <PolymarketLogo className="h-4 w-auto" />;
      case 'kalshi':
        return <KalshiLogo className="h-4 w-auto" />;
      case 'simmer':
        return <SimmerLogo className="h-4 w-auto" />;
    }
  };

  const getProviderBadgeColor = (provider: 'polymarket' | 'kalshi' | 'simmer') => {
    switch (provider) {
      case 'polymarket':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'kalshi':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'simmer':
        return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30';
    }
  };

  return (
    <Card className="mt-4 border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Found {results.length} Market{results.length !== 1 ? 's' : ''}</span>
          {results.length > 1 && onAnalyzeAll && (
            <Button
              size="sm"
              onClick={onAnalyzeAll}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze All
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          Select a market to get detailed AI analysis, or analyze all similar markets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={`${result.provider}-${result.id}`}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {result.imageUrl && (
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src={result.imageUrl}
                    alt={result.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm line-clamp-2">{result.title}</h4>
                  <Badge className={`shrink-0 ${getProviderBadgeColor(result.provider)}`}>
                    <span className="mr-1">{getProviderLogo(result.provider)}</span>
                    {result.provider.toUpperCase()}
                  </Badge>
                </div>
                {result.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {result.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Link href={`/markets/${result.provider}/${result.slug}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectMarket?.(result)}
                      className="text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Get AI Signal
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="text-xs"
                  >
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View on {result.provider === 'polymarket' ? 'Polymarket' : result.provider === 'kalshi' ? 'Kalshi' : 'Simmer'}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

