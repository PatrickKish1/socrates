import { NextRequest, NextResponse } from 'next/server';
import { parsePolymarketUrl, fetchPolymarketMarketBySlug } from '@/lib/api/polymarket';
import { parseKalshiUrl, fetchKalshiMarketByTicker } from '@/lib/api/kalshi';
import { parseSimmerUrl, fetchSimmerMarketById } from '@/lib/api/simmer';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    const polymarketSlug = parsePolymarketUrl(url);
    const kalshiTicker = parseKalshiUrl(url);
    const simmerId = parseSimmerUrl(url);

    if (polymarketSlug) {
      const market = await fetchPolymarketMarketBySlug(polymarketSlug);
      if (market) {
        return NextResponse.json({
          success: true,
          provider: 'polymarket',
          slug: polymarketSlug,
          market,
        });
      }
    } else if (kalshiTicker) {
      const market = await fetchKalshiMarketByTicker(kalshiTicker);
      if (market) {
        return NextResponse.json({
          success: true,
          provider: 'kalshi',
          slug: kalshiTicker,
          market,
        });
      }
    } else if (simmerId) {
      const market = await fetchSimmerMarketById(simmerId);
      if (market) {
        return NextResponse.json({
          success: true,
          provider: 'simmer',
          slug: simmerId,
          market,
        });
      }
    }

    return NextResponse.json(
      { error: 'Could not parse market URL or market not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error parsing market URL:', error);
    return NextResponse.json(
      { error: 'Failed to parse URL', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

