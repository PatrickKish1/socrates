'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  marketSlug?: string;
  provider?: 'polymarket' | 'kalshi' | 'simmer';
}

export function MarkdownRenderer({ content, marketSlug, provider }: MarkdownRendererProps) {
  // Parse markdown and render it
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let key = 0;

    // Pattern to match "Get AI Signal" text - more flexible to catch variations
    const signalPattern = /For a more comprehensive analysis with visual signals[^.]*"Get AI Signal"[^.]*\./i;
    
    // Check if we have market info to create a button
    const hasMarketInfo = marketSlug && provider;
    
    // Split by the signal pattern first
    const signalMatch = text.match(signalPattern);
    
    if (signalMatch) {
      const beforeSignal = text.substring(0, signalMatch.index);
      const afterSignal = text.substring((signalMatch.index || 0) + signalMatch[0].length);
      
      // Parse the part before the signal
      parts.push(...parseMarkdownContent(beforeSignal, key));
      key += 1000;
      
      // Add the button
      if (hasMarketInfo) {
        const marketUrl = `/markets/${provider}/${marketSlug}`;
        parts.push(
          <div key={key++} className="mt-4 p-4 bg-muted rounded-lg border-2 border-orange-500/20">
            <p className="text-sm text-muted-foreground mb-3">
              For a more comprehensive analysis with visual signals:
            </p>
            <Link href={marketUrl}>
              <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Signal
              </Button>
            </Link>
          </div>
        );
      } else {
        // If no market info, just render the text
        parts.push(
          <p key={key++} className="text-sm text-muted-foreground mt-4">
            {signalMatch[0]}
          </p>
        );
      }
      
      // Parse the part after the signal (if any)
      if (afterSignal.trim()) {
        parts.push(...parseMarkdownContent(afterSignal, key));
      }
    } else {
      // No signal pattern, just parse normally
      parts.push(...parseMarkdownContent(text, key));
    }

    return parts;
  };

  const parseMarkdownContent = (text: string, startKey: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let key = startKey;
    let currentIndex = 0;

    // Split by lines to handle headers and lists
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Headers (###, ##, #)
      if (line.startsWith('### ')) {
        parts.push(
          <h3 key={key++} className="text-lg font-bold mt-4 mb-2">
            {parseInlineMarkdown(line.substring(4), key * 1000)}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        parts.push(
          <h2 key={key++} className="text-xl font-bold mt-6 mb-3">
            {parseInlineMarkdown(line.substring(3), key * 1000)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        parts.push(
          <h1 key={key++} className="text-2xl font-bold mt-6 mb-4">
            {parseInlineMarkdown(line.substring(2), key * 1000)}
          </h1>
        );
      }
      // List items (starting with -)
      else if (line.trim().startsWith('- ')) {
        const listItems: React.ReactNode[] = [];
        let j = i;
        
        // Collect consecutive list items
        while (j < lines.length && (lines[j].trim().startsWith('- ') || lines[j].trim() === '')) {
          if (lines[j].trim().startsWith('- ')) {
            listItems.push(
              <li key={key++} className="ml-4 mb-1">
                {parseInlineMarkdown(lines[j].trim().substring(2), key * 1000)}
              </li>
            );
          }
          j++;
        }
        
        if (listItems.length > 0) {
          parts.push(
            <ul key={key++} className="list-disc ml-6 mb-3 space-y-1">
              {listItems}
            </ul>
          );
          i = j - 1; // Skip processed lines
        }
      }
      // Regular paragraphs
      else if (line.trim()) {
        parts.push(
          <p key={key++} className="mb-2">
            {parseInlineMarkdown(line, key * 1000)}
          </p>
        );
      }
      // Empty lines
      else if (i === 0 || lines[i - 1].trim()) {
        // Only add spacing if previous line had content
        parts.push(<br key={key++} />);
      }
    }

    return parts;
  };

  const parseInlineMarkdown = (text: string, startKey: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let key = startKey;
    let currentIndex = 0;

    // Pattern for bold text: **text**
    const boldPattern = /\*\*(.+?)\*\*/g;
    let match;

    while ((match = boldPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        const beforeText = text.substring(currentIndex, match.index);
        if (beforeText) {
          parts.push(<span key={key++}>{beforeText}</span>);
        }
      }

      // Add the bold text
      parts.push(
        <strong key={key++} className="font-bold">
          {match[1]}
        </strong>
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        parts.push(<span key={key++}>{remainingText}</span>);
      }
    }

    // If no bold text was found, return the original text
    if (parts.length === 0) {
      return [<span key={key}>{text}</span>];
    }

    return parts;
  };

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {parseMarkdown(content)}
    </div>
  );
}

