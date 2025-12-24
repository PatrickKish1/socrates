import { mainnet, polygon, arbitrum, base, optimism } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '';

export const networks = [mainnet, polygon, arbitrum, base, optimism];

export const wagmiAdapter = new WagmiAdapter({ networks, projectId });

export const config = wagmiAdapter.wagmiConfig;

