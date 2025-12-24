'use client';

import { useAppKit } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Network } from 'lucide-react';

export function NetworkSwitcher() {
  const { open } = useAppKit();

  return (
    <Button
      onClick={() => open({ view: 'Networks' })}
      variant="outline"
      className="bg-white text-black hover:bg-black hover:text-white border-2 border-black font-mono dark:bg-black dark:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
    >
      <Network className="w-4 h-4 mr-2" />
      <span className="hidden lg:inline">Switch </span>Network
    </Button>
  );
}

