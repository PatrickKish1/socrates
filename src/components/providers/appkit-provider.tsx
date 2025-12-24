'use client';

import { createAppKit } from '@reown/appkit/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiAdapter, networks } from '@/lib/wagmi-config';

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';

const metadata = {
  name: 'Socrates',
  description: 'AI Prediction Market Analyst',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://socrates.vercelapp',
  icons: ['/logo-socrates.png'],
};

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: networks as any,
  metadata,
  allowUnsupportedChain: true,
  enableReconnect: true,
  enableAuthLogger: true,
  enableCoinbase: true,
  enableNetworkSwitch: true,
  enableMobileFullScreen: true,
  coinbasePreference: 'all',
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook'],
    emailShowWallets: true,
    swaps: true,
    receive: true,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#FF6B35',
    '--w3m-border-radius-master': '8px',
  },
});

// Create QueryClient instance (not using hook)
const queryClient = new QueryClient();

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

