import { Header } from '@/components/header/header';
import { MarketDetails } from '@/components/markets/market-details';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPolymarketMarketBySlug } from '@/lib/api/polymarket';
import { fetchKalshiMarketByTicker } from '@/lib/api/kalshi';
import { fetchSimmerMarketById } from '@/lib/api/simmer';
import { getMarketTitle, getMarketDescription, getMarketImage, type Provider } from '@/lib/types/market-helpers';

interface MarketDetailsPageProps {
  params: Promise<{
    provider: string;
    slug: string;
  }>;
}

function isValidProvider(provider: string): provider is Provider {
  return provider === 'polymarket' || provider === 'kalshi' || provider === 'simmer';
}

export async function generateMetadata({ params }: MarketDetailsPageProps): Promise<Metadata> {
  const { provider, slug } = await params;

  if (!isValidProvider(provider)) {
    return {
      title: 'Market Not Found',
    };
  }

  try {
    const market = provider === 'polymarket'
      ? await fetchPolymarketMarketBySlug(slug)
      : provider === 'kalshi'
      ? await fetchKalshiMarketByTicker(slug)
      : await fetchSimmerMarketById(slug);

    if (!market) {
      return {
        title: 'Market Not Found',
      };
    }

    const title = getMarketTitle(market, provider);
    const description = getMarketDescription(market, provider) || `AI-powered analysis for ${title}`;
    const imageUrl = getMarketImage(market, provider);

    return {
      title,
      description: description.substring(0, 160),
      openGraph: {
        title: `${title} | Socrates`,
        description: description.substring(0, 160),
        url: `/markets/${provider}/${slug}`,
        images: imageUrl ? [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Socrates`,
        description: description.substring(0, 160),
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Market Analysis',
    };
  }
}

export default async function MarketDetailsPage({ params }: MarketDetailsPageProps) {
  const { provider, slug } = await params;

  if (!isValidProvider(provider)) {
    notFound();
  }

  // Generate structured data for SEO
  let structuredData = null;
  try {
    const market = provider === 'polymarket'
      ? await fetchPolymarketMarketBySlug(slug)
      : provider === 'kalshi'
      ? await fetchKalshiMarketByTicker(slug)
      : await fetchSimmerMarketById(slug);

    if (market) {
      const title = getMarketTitle(market, provider);
      const description = getMarketDescription(market, provider);
      
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'FinancialProduct',
        name: title,
        description: description || `AI-powered analysis for ${title}`,
        provider: {
          '@type': 'Organization',
          name: provider === 'polymarket' ? 'Polymarket' : provider === 'kalshi' ? 'Kalshi' : 'Simmer',
        },
        category: 'Prediction Market',
      };
    }
  } catch (error) {
    // Ignore errors for structured data
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
        <MarketDetails provider={provider} slug={slug} />
      </main>
    </div>
  );
}

