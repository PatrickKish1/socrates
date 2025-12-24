'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, BarChart3 } from 'lucide-react';
import { PolymarketMarket } from '@/lib/api/polymarket';
import { KalshiMarket } from '@/lib/api/kalshi';
import { SimmerMarket } from '@/lib/api/simmer';
import { OutcomeVisualization } from './outcome-visualization';

interface AISignalProps {
  market: PolymarketMarket | KalshiMarket | SimmerMarket;
  provider: 'polymarket' | 'kalshi' | 'simmer';
}

interface AISignalResponse {
  outcome: string; // Can be 'yes', 'no', 'NVIDIA', 'Microsoft', etc.
  confidence: number;
  outcomes: {
    [key: string]: number; // Dynamic outcome names with confidence percentages
  };
  reasoning: string;
  comparativeAnalysis: string;
}

export function AISignal({ market, provider }: AISignalProps) {
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<AISignalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSignal = async () => {
    setLoading(true);
    setError(null);
    setSignal(null);

    try {
      const response = await fetch('/api/ai/analyze-market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          market,
          provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI signal');
      }

      const data = await response.json();
      setSignal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGetSignal}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Get AI Signal
          </>
        )}
      </Button>

      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {signal && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AI Prediction</span>
                <Badge
                  variant={signal.outcome?.toLowerCase() === 'yes' ? 'default' : 'destructive'}
                  className="text-lg px-3 py-1"
                >
                  {signal.outcome?.toUpperCase() || 'UNKNOWN'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Confidence: {(signal.confidence ?? 0).toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {signal.outcomes && Object.keys(signal.outcomes).length > 0 ? (
                  <OutcomeVisualization
                    outcomes={signal.outcomes}
                    primaryOutcome={signal.outcome}
                  />
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                    No outcome data available
                  </div>
                )}
                
                <Tabs defaultValue="reasoning" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reasoning">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Primary Analysis
                    </TabsTrigger>
                    <TabsTrigger value="comparative">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Comparative Analysis
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="reasoning" className="mt-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Why {signal.outcome?.toUpperCase() || 'Selected Outcome'}?</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {signal.reasoning || 'No reasoning provided'}
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="comparative" className="mt-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Why Other Outcomes Are Less Likely</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {signal.comparativeAnalysis || 'No comparative analysis provided'}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

