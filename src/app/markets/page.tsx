import { Header } from '@/components/header/header';
import { MarketsList } from '@/components/markets/markets-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Prediction Markets",
  description: "Browse and analyze prediction markets from Polymarket and Kalshi. Get AI-powered insights and signals for informed trading decisions.",
  openGraph: {
    title: "Prediction Markets | Socrates",
    description: "Browse and analyze prediction markets from Polymarket and Kalshi",
    url: "/markets",
  },
};

export default function MarketsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <MarketsList />
      </main>
    </div>
  );
}

