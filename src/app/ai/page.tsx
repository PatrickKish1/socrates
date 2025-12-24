import { Header } from '@/components/header/header';
import { AIChat } from '@/components/ai/ai-chat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Chat with Socrates AI to get predictions and analysis for any prediction market. Paste market links or ask questions about markets on Polymarket and Kalshi.",
  openGraph: {
    title: "AI Chat | Socrates",
    description: "Chat with Socrates AI for prediction market analysis",
    url: "/ai",
  },
};

export default function AIPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AIChat />
      </main>
    </div>
  );
}

