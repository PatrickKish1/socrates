'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="bg-white text-black hover:bg-black hover:text-white border-2 border-black dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black font-mono transition-all duration-300"
        aria-label="Toggle theme"
      >
        <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="bg-white text-black hover:bg-black hover:text-white border-2 border-black dark:bg-black dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black font-mono transition-all duration-300 relative overflow-hidden"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative top-1 left-1 w-8 h-8 sm:w-5 sm:h-5 scale-[1.6] items-center justify-center">
        <Sun
          className={`absolute inset-0 w-6 h-6 sm:w-5 sm:h-5 transition-all duration-300 ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 sm:w-5 sm:h-5 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </Button>
  );
}

