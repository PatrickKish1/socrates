'use client';

import { useState, useEffect, useRef } from 'react';
import { MarketCard } from './market-card';
import { MarketFilters } from './market-filters';
import { fetchPolymarketMarkets, PolymarketMarket } from '@/lib/api/polymarket';
import { fetchKalshiMarkets, KalshiMarket } from '@/lib/api/kalshi';
import { fetchSimmerMarkets, SimmerMarket } from '@/lib/api/simmer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

type Provider = 'polymarket' | 'kalshi' | 'simmer';

// Helper function to compare market arrays by their IDs
function areMarketsDifferent<T extends { id?: string; slug?: string; event_ticker?: string }>(
  oldMarkets: T[],
  newMarkets: T[]
): boolean {
  if (oldMarkets.length !== newMarkets.length) return true;
  
  // Create sets of identifiers (id, slug, or event_ticker)
  const oldIds = new Set(
    oldMarkets.map(m => {
      // For Simmer: use id
      // For Polymarket: use slug
      // For Kalshi: use event_ticker
      return m.id || m.slug || m.event_ticker || '';
    }).filter(id => id !== '')
  );
  
  const newIds = new Set(
    newMarkets.map(m => {
      return m.id || m.slug || m.event_ticker || '';
    }).filter(id => id !== '')
  );
  
  if (oldIds.size !== newIds.size) return true;
  
  // Check if all old IDs exist in new IDs
  for (const id of oldIds) {
    if (!newIds.has(id)) return true;
  }
  
  // Also check if any new IDs don't exist in old IDs (new markets added)
  for (const id of newIds) {
    if (!oldIds.has(id)) return true;
  }
  
  return false;
}

export function MarketsList() {
  const [provider, setProvider] = useState<Provider>('polymarket');
  const [polymarketMarkets, setPolymarketMarkets] = useState<PolymarketMarket[]>([]);
  const [kalshiMarkets, setKalshiMarkets] = useState<KalshiMarket[]>([]);
  const [simmerMarkets, setSimmerMarkets] = useState<SimmerMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All markets');
  const [polymarketLimit, setPolymarketLimit] = useState(50);
  const [hasMorePolymarket, setHasMorePolymarket] = useState(true);
  
  // Refs to store initial market data for comparison
  const initialMarketsRef = useRef<{
    polymarket: PolymarketMarket[];
    kalshi: KalshiMarket[];
    simmer: SimmerMarket[];
  }>({
    polymarket: [],
    kalshi: [],
    simmer: [],
  });

  // Initial load
  useEffect(() => {
    async function loadMarkets() {
      setLoading(true);
      try {
        if (provider === 'polymarket') {
          const markets = await fetchPolymarketMarkets(50);
          setPolymarketMarkets(markets);
          initialMarketsRef.current.polymarket = markets;
          setPolymarketLimit(50);
          setHasMorePolymarket(markets.length === 50); // If we got 50, there might be more
        } else if (provider === 'kalshi') {
          const markets = await fetchKalshiMarkets(50);
          setKalshiMarkets(markets);
          initialMarketsRef.current.kalshi = markets;
        } else if (provider === 'simmer') {
          const markets = await fetchSimmerMarkets(200);
          setSimmerMarkets(markets);
          initialMarketsRef.current.simmer = markets;
        }
      } catch (error) {
        console.error('Error loading markets:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMarkets();
  }, [provider]);

  // Load more markets for Polymarket
  const handleLoadMore = async () => {
    if (loadingMore || !hasMorePolymarket || provider !== 'polymarket') return;

    setLoadingMore(true);
    try {
      const newLimit = polymarketLimit + 50;
      const newMarkets = await fetchPolymarketMarkets(newLimit);
      
      // Deduplicate by slug
      const existingSlugs = new Set(polymarketMarkets.map(m => m.slug));
      const uniqueNewMarkets = newMarkets.filter(m => !existingSlugs.has(m.slug));
      
      if (uniqueNewMarkets.length > 0) {
        setPolymarketMarkets([...polymarketMarkets, ...uniqueNewMarkets]);
        setPolymarketLimit(newLimit);
        setHasMorePolymarket(newMarkets.length === newLimit); // If we got the full limit, there might be more
      } else {
        // No new unique markets, we've reached the end
        setHasMorePolymarket(false);
      }
    } catch (error) {
      console.error('Error loading more markets:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Background refresh every 5 minutes (only for Simmer)
  useEffect(() => {
    if (provider !== 'simmer') return;

    const refreshInterval = setInterval(async () => {
      try {
        // Fetch new data in background (doesn't affect frontend)
        const newMarkets = await fetchSimmerMarkets(200);
        
        // Compare with current data
        const currentMarkets = simmerMarkets.length > 0 
          ? simmerMarkets 
          : initialMarketsRef.current.simmer;
        
        // Only update if data is different
        if (areMarketsDifferent(currentMarkets, newMarkets)) {
          console.log('Simmer markets updated - new data detected');
          setSimmerMarkets(newMarkets);
          initialMarketsRef.current.simmer = newMarkets;
        } else {
          console.log('Simmer markets refresh - no changes detected');
        }
      } catch (error) {
        console.error('Error refreshing Simmer markets:', error);
        // Don't update state on error - keep existing data
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [provider, simmerMarkets]);

  const isPolymarket = provider === 'polymarket';
  const isKalshi = provider === 'kalshi';
  const isSimmer = provider === 'simmer';
  
  const currentMarkets = isPolymarket 
    ? polymarketMarkets 
    : isKalshi 
    ? kalshiMarkets 
    : simmerMarkets;

  // Calculate statistics
  const totalValueLocked = currentMarkets.reduce((sum, market) => {
    if (isPolymarket) {
      return sum + ((market as PolymarketMarket).volumeNum || (market as PolymarketMarket).volume || 0);
    } else if (isKalshi) {
      return sum + ((market as KalshiMarket).volume || 0);
    } else if (isSimmer) {
      return sum + ((market as SimmerMarket).total_volume || 0);
    }
    return sum;
  }, 0);

  // Extract available categories from markets
  const availableCategories = ['All markets'];
  if (isPolymarket) {
    const allTags = new Set<string>();
    polymarketMarkets.forEach(market => {
      (market.tags || []).forEach(tag => {
        if (tag && typeof tag === 'object' && 'label' in tag) {
          allTags.add(tag.label);
        } else if (typeof tag === 'string') {
          allTags.add(tag);
        }
      });
    });
    availableCategories.push(...Array.from(allTags).sort());
  } else if (isSimmer) {
    const allTags = new Set<string>();
    simmerMarkets.forEach(market => {
      (market.tags || []).forEach(tag => {
        if (typeof tag === 'string') {
          allTags.add(tag);
        }
      });
    });
    availableCategories.push(...Array.from(allTags).sort());
  } else {
    // For Kalshi, use default categories
    availableCategories.push('Top markets', 'Sports', 'Crypto', 'Politics', 'Election');
  }

  const filteredMarkets = selectedCategory === 'All markets' 
    ? currentMarkets 
    : currentMarkets.filter(market => {
        if (isPolymarket) {
          const tags = (market as PolymarketMarket).tags || [];
          return tags.some(tag => {
            const tagLabel = typeof tag === 'object' && 'label' in tag ? tag.label : String(tag);
            return tagLabel.toLowerCase() === selectedCategory.toLowerCase() ||
                   tagLabel.toLowerCase().includes(selectedCategory.toLowerCase());
          });
        } else if (isSimmer) {
          const tags = (market as SimmerMarket).tags || [];
          return tags.some(tag => {
            const tagStr = typeof tag === 'string' ? tag : String(tag);
            return tagStr.toLowerCase() === selectedCategory.toLowerCase() ||
                   tagStr.toLowerCase().includes(selectedCategory.toLowerCase());
          });
        }
        return true; // Kalshi doesn't have tags in our current structure
      });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-mono">Markets</h1>
        <div className="flex gap-2">
          <Button
            variant={provider === 'polymarket' ? 'default' : 'outline'}
            onClick={() => setProvider('polymarket')}
            className={`font-mono ${
              provider === 'polymarket' 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : ''
            }`}
          >
            Polymarket
          </Button>
          <Button
            variant={provider === 'kalshi' ? 'default' : 'outline'}
            onClick={() => setProvider('kalshi')}
            className={`font-mono ${
              provider === 'kalshi' 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : ''
            }`}
          >
            Kalshi
          </Button>
          <Button
            variant={provider === 'simmer' ? 'default' : 'outline'}
            onClick={() => setProvider('simmer')}
            className={`font-mono ${
              provider === 'simmer' 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : ''
            }`}
          >
            Simmer
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border-2 border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total value locked</div>
          <div className="text-2xl font-bold">${totalValueLocked.toLocaleString()}</div>
        </div>
        <div className="bg-card border-2 border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">No of markets</div>
          <div className="text-2xl font-bold">{currentMarkets.length}</div>
        </div>
        <div className="bg-card border-2 border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">No of winners (24hrs)</div>
          <div className="text-2xl font-bold">0</div>
        </div>
      </div>

      {/* Category Filters */}
      <MarketFilters 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={availableCategories}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : currentMarkets.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No markets available
          </div>
        ) : (
          filteredMarkets.map((market) => {
            const key = isPolymarket 
              ? (market as PolymarketMarket).slug 
              : isKalshi 
              ? (market as KalshiMarket).event_ticker 
              : (market as SimmerMarket).id;
            return (
              <MarketCard
                key={key}
                market={market}
                provider={provider}
              />
            );
          }          )
        )}
      </div>

      {/* Load More Button for Polymarket */}
      {provider === 'polymarket' && hasMorePolymarket && !loading && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Markets'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

