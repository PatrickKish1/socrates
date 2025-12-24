'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';

export function MarketFilters({ 
  selectedCategory, 
  onCategoryChange,
  categories = ['All markets', 'Top markets', 'Sports', 'Crypto', 'Politics', 'Election', 'Tiktok', 'Top']
}: { 
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: string[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex items-center gap-2 mb-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('left')}
        className="shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.slice(0, 20).map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            onClick={() => onCategoryChange(category)}
            className={`whitespace-nowrap font-mono text-sm ${
              selectedCategory === category
                ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {category}
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => scroll('right')}
        className="shrink-0"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

