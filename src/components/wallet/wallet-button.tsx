'use client';

import '@reown/appkit-wallet-button/react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected, embeddedWalletInfo } = useAppKitAccount();
  const [ensName, setEnsName] = useState<string | null>(null);
  const [isLoadingENS, setIsLoadingENS] = useState(false);
  
  const userInfo = useMemo(() => {
    if (!embeddedWalletInfo) return null;
    
    try {
      const info = embeddedWalletInfo as any;
      return {
        email: info?.email || null,
        name: info?.name || info?.displayName || info?.username || null,
      };
    } catch {
      return null;
    }
  }, [embeddedWalletInfo]);

  useEffect(() => {
    if (!isConnected || !address) {
      setEnsName(null);
      return;
    }

    let cancelled = false;

    async function fetchENS() {
      setIsLoadingENS(true);
      try {
        const response = await fetch(
          `https://api.ensideas.com/ens/resolve/${address}`
        );
        if (!cancelled && response.ok) {
          const data = await response.json();
          if (data.name) {
            setEnsName(data.name);
          } else {
            setEnsName(null);
          }
        } else if (!cancelled) {
          setEnsName(null);
        }
      } catch (error) {
        console.error('Error fetching ENS name:', error);
        if (!cancelled) {
          setEnsName(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingENS(false);
        }
      }
    }

    fetchENS();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const displayName = useMemo(() => {
    if (!isConnected || !address) {
      return null;
    }

    if (ensName) {
      return ensName;
    }

    if (userInfo) {
      if (userInfo.email) {
        const emailUsername = userInfo.email.split('@')[0];
        return emailUsername;
      }
      
      if (userInfo.name) {
        return userInfo.name;
      }
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [isConnected, address, ensName, userInfo]);

  return (
    <Button
      onClick={() => open()}
      variant="outline"
      className="bg-white text-black hover:bg-black hover:text-white border-2 border-black dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black font-mono transition-colors duration-300"
      title={
        isConnected && address
          ? ensName
            ? `${ensName} (${address})`
            : userInfo
            ? `${displayName} (${address})`
            : address
          : 'Connect Wallet'
      }
    >
      {isConnected && address 
        ? (
          <span>
            {isLoadingENS ? (
              `${address.slice(0, 6)}...${address.slice(-4)}`
            ) : (
              displayName || `${address.slice(0, 6)}...${address.slice(-4)}`
            )}
          </span>
        )
        : <span>CONNECT WALLET</span>
      }
    </Button>
  );
}

