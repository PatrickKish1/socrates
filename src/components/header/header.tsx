'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { WalletButton } from '@/components/wallet/wallet-button';
import { NetworkSwitcher } from '@/components/wallet/network-switcher';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b-2 border-black bg-white dark:bg-black dark:border-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <Image 
              src="/logo-socrates.png" 
              alt="Socrates Logo" 
              width={32}
              height={32}
              className="h-6 w-6 sm:h-8 sm:w-8"
            />
            <span className="text-lg sm:text-xl font-bold font-mono tracking-wider">
              SOCRATES
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 xl:space-x-6">
            <Link
              href="/markets"
              className="font-mono text-xs lg:text-sm font-medium hover:underline tracking-wide transition-all whitespace-nowrap"
            >
              MARKETS
            </Link>
            <Link
              href="/ai"
              className="font-mono text-xs lg:text-sm font-medium hover:underline tracking-wide transition-all whitespace-nowrap"
            >
              AI ANALYST
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <ThemeToggle />
            <NetworkSwitcher />
            <WalletButton />
          </div>

          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="outline"
            className="md:hidden bg-black text-white hover:bg-white hover:text-black border-2 border-black font-mono px-2 py-1.5 text-sm min-w-[40px]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t-2 border-black dark:border-white pt-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/markets"
                className="font-mono text-sm font-medium hover:underline tracking-wide"
                onClick={() => setMobileMenuOpen(false)}
              >
                MARKETS
              </Link>
              <Link
                href="/ai"
                className="font-mono text-sm font-medium hover:underline tracking-wide"
                onClick={() => setMobileMenuOpen(false)}
              >
                AI ANALYST
              </Link>
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-300 dark:border-gray-700">
                <ThemeToggle />
                <NetworkSwitcher />
                <WalletButton />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

