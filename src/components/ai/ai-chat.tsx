'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Sparkles, Trash2 } from 'lucide-react';
import { parsePolymarketUrl } from '@/lib/api/polymarket';
import { parseKalshiUrl } from '@/lib/api/kalshi';
import { parseSimmerUrl } from '@/lib/api/simmer';
import { MarkdownRenderer } from './markdown-renderer';
import { TTSControls } from './tts-controls';
import { MarketSearchResults } from './market-search-results';

interface SearchResult {
  provider: 'polymarket' | 'kalshi' | 'simmer';
  id: string;
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  url: string;
  relevanceScore?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  marketSlug?: string;
  provider?: 'polymarket' | 'kalshi' | 'simmer';
  marketSearchResults?: SearchResult[];
}

interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export function AIChat() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId);

  useEffect(() => {
    const savedThreads = localStorage.getItem('socrates-chat-threads');
    if (savedThreads) {
      const parsed = JSON.parse(savedThreads);
      setThreads(parsed.map((t: any) => ({
        ...t,
        messages: t.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
        createdAt: new Date(t.createdAt),
      })));
    }
  }, []);

  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem('socrates-chat-threads', JSON.stringify(threads));
    }
  }, [threads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  const createNewThread = () => {
    const newThread: ChatThread = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newThread.id);
  };

  const deleteThread = (threadId: string) => {
    setThreads(threads.filter(t => t.id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(threads.find(t => t.id !== threadId)?.id || null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    let currentThread = activeThread;
    if (!currentThread) {
      currentThread = {
        id: Date.now().toString(),
        title: input.slice(0, 50),
        messages: [],
        createdAt: new Date(),
      };
      setThreads([currentThread, ...threads]);
      setActiveThreadId(currentThread.id);
    }

    const updatedThread = {
      ...currentThread,
      messages: [...currentThread.messages, userMessage],
      title: currentThread.messages.length === 0 ? input.slice(0, 50) : currentThread.title,
    };

    setThreads(threads.map(t => t.id === updatedThread.id ? updatedThread : t));
    setInput('');
    setLoading(true);

    try {
      const polymarketSlug = parsePolymarketUrl(input);
      const kalshiTicker = parseKalshiUrl(input);
      const simmerId = parseSimmerUrl(input);
      
      // Determine if we should search for markets
      // Search if: no URL provided, and message seems to be asking about a market
      const shouldSearchMarkets = !polymarketSlug && !kalshiTicker && !simmerId && (
        input.toLowerCase().includes('market') ||
        input.toLowerCase().includes('prediction') ||
        input.toLowerCase().includes('find') ||
        input.toLowerCase().includes('search') ||
        input.toLowerCase().includes('what') ||
        input.toLowerCase().includes('show me') ||
        input.toLowerCase().includes('analyze') ||
        input.toLowerCase().includes('polymarket') ||
        input.toLowerCase().includes('simmer') ||
        input.toLowerCase().includes('kalshi')
      );
      
      let marketContext = null;
      if (polymarketSlug || kalshiTicker || simmerId) {
        try {
          const parseResponse = await fetch('/api/markets/parse-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: input }),
          });

          if (parseResponse.ok) {
            const parseData = await parseResponse.json();
            if (parseData.success && parseData.market) {
              marketContext = {
                provider: parseData.provider,
                market: parseData.market,
              };
            }
          }
        } catch (error) {
          console.error('Error fetching market from URL:', error);
        }
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          threadId: updatedThread.id,
          history: updatedThread.messages.slice(0, -1).map(m => ({
            role: m.role,
            content: m.content,
          })),
          marketContext: marketContext
            ? marketContext
            : (polymarketSlug
              ? { provider: 'polymarket', slug: polymarketSlug }
              : kalshiTicker
              ? { provider: 'kalshi', slug: kalshiTicker }
              : simmerId
              ? { provider: 'simmer', slug: simmerId }
              : null),
          shouldSearchMarkets,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Extract market info from context if available
      let marketSlug: string | undefined;
      let marketProvider: 'polymarket' | 'kalshi' | 'simmer' | undefined;
      
      if (marketContext) {
        marketProvider = marketContext.provider;
        if ('market' in marketContext && marketContext.market) {
          const market = marketContext.market as any;
          if (marketProvider === 'polymarket' && market.slug) {
            marketSlug = String(market.slug);
          } else if (marketProvider === 'kalshi' && market.event_ticker) {
            marketSlug = String(market.event_ticker);
          } else if (marketProvider === 'simmer' && market.id) {
            marketSlug = String(market.id);
          }
        } else if ('slug' in marketContext && marketContext.slug) {
          marketSlug = String(marketContext.slug);
        }
      } else {
        // Fallback to parsed slugs/IDs
        if (polymarketSlug) {
          marketProvider = 'polymarket';
          marketSlug = polymarketSlug;
        } else if (kalshiTicker) {
          marketProvider = 'kalshi';
          marketSlug = kalshiTicker;
        } else if (simmerId) {
          marketProvider = 'simmer';
          marketSlug = simmerId;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        marketSlug,
        provider: marketProvider,
        marketSearchResults: data.marketSearchResults || undefined,
      };

      const finalThread = {
        ...updatedThread,
        messages: [...updatedThread.messages, assistantMessage],
      };

      setThreads(threads.map(t => t.id === finalThread.id ? finalThread : t));
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      const finalThread = {
        ...updatedThread,
        messages: [...updatedThread.messages, errorMessage],
      };
      setThreads(threads.map(t => t.id === finalThread.id ? finalThread : t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Button onClick={createNewThread} className="w-full" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {threads.map(thread => (
            <div
              key={thread.id}
              className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                activeThreadId === thread.id ? 'bg-gray-200 dark:bg-gray-700' : ''
              }`}
              onClick={() => setActiveThreadId(thread.id)}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium truncate flex-1">{thread.title}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteThread(thread.id);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {thread.messages.length} messages
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeThread ? (
          <>
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle>{activeThread.title}</CardTitle>
                <CardDescription>
                  {activeThread.messages.length} messages
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4">
                {activeThread.messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <>
                          <MarkdownRenderer
                            content={message.content}
                            marketSlug={message.marketSlug}
                            provider={message.provider}
                          />
                          {message.marketSearchResults && message.marketSearchResults.length > 0 && (
                            <div className="mt-4">
                              <MarketSearchResults
                                results={message.marketSearchResults}
                                onSelectMarket={(result) => {
                                  // Navigate to market details page
                                  window.location.href = `/markets/${result.provider}/${result.slug}`;
                                }}
                                onAnalyzeAll={async () => {
                                  // Analyze all similar markets
                                  if (message.marketSearchResults && message.marketSearchResults.length > 0) {
                                    const analysisPromises = message.marketSearchResults.map(async (result) => {
                                      try {
                                        const response = await fetch(`/api/markets/parse-url`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ 
                                            url: result.url 
                                          }),
                                        });
                                        if (response.ok) {
                                          const data = await response.json();
                                          return data.market ? { ...result, marketData: data.market } : null;
                                        }
                                      } catch (error) {
                                        console.error(`Error fetching market ${result.id}:`, error);
                                      }
                                      return null;
                                    });
                                    
                                    // You could trigger analysis for all markets here
                                    // For now, just show a message
                                    alert(`Analyzing ${message.marketSearchResults.length} markets... This feature will provide comparative analysis across all similar markets.`);
                                  }
                                }}
                              />
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <TTSControls text={message.content} />
                          </div>
                        </>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>
            <div className="mt-4 flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about a market or paste a market URL..."
                className="flex-1 min-h-[100px]"
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <CardContent className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
              <p className="text-muted-foreground mb-4">
                Ask me about prediction markets or paste a market URL to get started
              </p>
              <Button onClick={createNewThread}>
                <Sparkles className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

