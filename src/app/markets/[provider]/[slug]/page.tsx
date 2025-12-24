import { Header } from '@/components/header/header';
import { MarketDetails } from '@/components/markets/market-details';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPolymarketMarketBySlug } from '@/lib/api/polymarket';
import { fetchKalshiMarketByTicker } from '@/lib/api/kalshi';
import { fetchSimmerMarketById } from '@/lib/api/simmer';

interface MarketDetailsPageProps {
  params: Promise<{
    provider: string;
    slug: string;
  }>;
}

export async function generateMetadata({ params }: MarketDetailsPageProps): Promise<Metadata> {
  const { provider, slug } = await params;

  if (provider !== 'polymarket' && provider !== 'kalshi' && provider !== 'simmer') {
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

    const title = provider === 'polymarket'
      ? (market.title || market.question || 'Market')
      : provider === 'kalshi'
      ? market.title || 'Market'
      : (market as any).question || 'Market';

    const description = provider === 'polymarket'
      ? (market.description || `AI-powered analysis for ${title}`)
      : provider === 'kalshi'
      ? (market.subtitle || `AI-powered analysis for ${title}`)
      : ((market as any).context || (market as any).resolution_criteria || `AI-powered analysis for ${title}`);

    const imageUrl = provider === 'polymarket'
      ? (market.image || market.icon || market.imageUrl)
      : provider === 'kalshi'
      ? market.image_url
      : (market as any).image_url;

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

  if (provider !== 'polymarket' && provider !== 'kalshi' && provider !== 'simmer') {
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
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'FinancialProduct',
        name: provider === 'polymarket' 
          ? (market.title || market.question) 
          : provider === 'kalshi'
          ? market.title
          : (market as any).question,
        description: provider === 'polymarket' 
          ? market.description 
          : provider === 'kalshi'
          ? market.subtitle
          : ((market as any).context || (market as any).resolution_criteria),
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

