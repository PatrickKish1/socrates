import { NextRequest, NextResponse } from 'next/server';
import { fetchPolymarketMarkets } from '@/lib/api/polymarket';
import { fetchSimmerMarkets } from '@/lib/api/simmer';
// import { fetchKalshiMarkets } from '@/lib/api/kalshi'; // Uncomment when API keys are available

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

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 10 } = await request.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const searchQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // Search Polymarket
    try {
      const polymarketMarkets = await fetchPolymarketMarkets(200);
      const polymarketResults = polymarketMarkets
        .filter(market => {
          const title = (market.title || market.question || '').toLowerCase();
          const description = (market.description || '').toLowerCase();
          const tags = (market.tags || []).map(tag => 
            typeof tag === 'object' ? tag.label.toLowerCase() : String(tag).toLowerCase()
          ).join(' ');
          
          return title.includes(searchQuery) || 
                 description.includes(searchQuery) || 
                 tags.includes(searchQuery);
        })
        .map(market => ({
          provider: 'polymarket' as const,
          id: market.id,
          slug: market.slug,
          title: market.title || market.question || 'Untitled Market',
          description: market.description,
          imageUrl: market.image || market.icon || market.imageUrl,
          url: `https://polymarket.com/event/${market.slug}`,
          relevanceScore: calculateRelevanceScore(market.title || market.question || '', market.description || '', searchQuery),
        }))
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, limit);

      results.push(...polymarketResults);
    } catch (error) {
      console.error('Error searching Polymarket:', error);
    }

    // Search Simmer
    try {
      const simmerMarkets = await fetchSimmerMarkets(200);
      const simmerResults = simmerMarkets
        .filter(market => {
          const question = (market.question || '').toLowerCase();
          const context = (market.context || '').toLowerCase();
          const resolutionCriteria = (market.resolution_criteria || '').toLowerCase();
          const tags = (market.tags || []).map(tag => String(tag).toLowerCase()).join(' ');
          
          return question.includes(searchQuery) || 
                 context.includes(searchQuery) || 
                 resolutionCriteria.includes(searchQuery) ||
                 tags.includes(searchQuery);
        })
        .map(market => ({
          provider: 'simmer' as const,
          id: market.id,
          slug: market.id,
          title: market.question || 'Untitled Market',
          description: market.context || market.resolution_criteria,
          imageUrl: market.image_url || undefined,
          url: `https://simmer.markets/markets/${market.id}`,
          relevanceScore: calculateRelevanceScore(market.question || '', market.context || market.resolution_criteria || '', searchQuery),
        }))
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, limit);

      results.push(...simmerResults);
    } catch (error) {
      console.error('Error searching Simmer:', error);
    }

    // Search Kalshi (commented out until API keys are available)
    /*
    try {
      const kalshiMarkets = await fetchKalshiMarkets(200);
      const kalshiResults = kalshiMarkets
        .filter(market => {
          const title = (market.title || '').toLowerCase();
          const subtitle = (market.subtitle || '').toLowerCase();
          
          return title.includes(searchQuery) || subtitle.includes(searchQuery);
        })
        .map(market => ({
          provider: 'kalshi' as const,
          id: market.event_ticker,
          slug: market.event_ticker,
          title: market.title || 'Untitled Market',
          description: market.subtitle,
          imageUrl: market.image_url,
          url: `https://kalshi.com/trade/${market.event_ticker}`,
          relevanceScore: calculateRelevanceScore(market.title || '', market.subtitle || '', searchQuery),
        }))
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, limit);

      results.push(...kalshiResults);
    } catch (error) {
      console.error('Error searching Kalshi:', error);
    }
    */

    // Sort all results by relevance score
    const sortedResults = results
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      query: searchQuery,
      results: sortedResults,
      count: sortedResults.length,
    });
  } catch (error) {
    console.error('Error in market search:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Calculate relevance score based on how well the query matches
function calculateRelevanceScore(title: string, description: string, query: string): number {
  let score = 0;
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact title match gets highest score
  if (titleLower === queryLower) {
    score += 100;
  }
  // Title starts with query
  else if (titleLower.startsWith(queryLower)) {
    score += 80;
  }
  // Query is in title
  else if (titleLower.includes(queryLower)) {
    score += 60;
  }
  // Query words all in title
  else {
    const queryWords = queryLower.split(/\s+/);
    const wordsInTitle = queryWords.filter(word => titleLower.includes(word)).length;
    score += (wordsInTitle / queryWords.length) * 40;
  }

  // Description matches
  if (descLower.includes(queryLower)) {
    score += 20;
  }

  // Bonus for shorter titles (more specific matches)
  if (title.length < 50) {
    score += 10;
  }

  return score;
}

