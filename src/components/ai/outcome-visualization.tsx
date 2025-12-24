'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OutcomeData {
  name: string;
  value: number;
  color: string;
}

interface OutcomeVisualizationProps {
  outcomes: {
    [key: string]: number; // Dynamic outcome names with confidence percentages
  };
  primaryOutcome: string; // The name of the primary predicted outcome
  onHover?: (outcome: string, confidence: number) => void;
}

const COLORS = {
  yes: '#22c55e',
  no: '#ef4444',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: any;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-black/90 text-white p-3 rounded-lg border border-white/20 shadow-lg">
        <p className="font-semibold">{data.name}</p>
        <p className="text-sm opacity-90">
          Confidence: <span className="font-bold">{data.value?.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-sm font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function OutcomeVisualization({
  outcomes,
  primaryOutcome,
  onHover,
}: OutcomeVisualizationProps) {
  // Handle null/undefined outcomes
  if (!outcomes || typeof outcomes !== 'object') {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No outcome data available</p>
        </CardContent>
      </Card>
    );
  }

  // Convert outcomes object to array format
  const outcomeEntries = Object.entries(outcomes).filter(([_, value]) => value != null);
  
  if (outcomeEntries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">No valid outcome data</p>
        </CardContent>
      </Card>
    );
  }

  // Generate colors for outcomes (use predefined for yes/no, generate for others)
  const getColorForOutcome = (outcomeName: string, index: number): string => {
    const lowerName = outcomeName.toLowerCase();
    if (lowerName === 'yes') return COLORS.yes;
    if (lowerName === 'no') return COLORS.no;
    // Generate colors for other outcomes
    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
    return colors[index % colors.length];
  };

  const data: OutcomeData[] = outcomeEntries.map(([name, value], index) => ({
    name,
    value: Number(value) || 0,
    color: getColorForOutcome(name, index),
  }));

  const barData = outcomeEntries.map(([outcome, confidence], index) => ({
    outcome,
    confidence: Number(confidence) || 0,
    color: getColorForOutcome(outcome, index),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outcome Probability Distribution</CardTitle>
        <CardDescription>
          AI confidence breakdown across all possible outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Tabs defaultValue="pie" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            </TabsList>
            <TabsContent value="pie" className="mt-4">
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data as any}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(entry: any, index: number) => {
                    if (onHover) {
                      onHover(entry.name, entry.value);
                    }
                  }}
                >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={primaryOutcome?.toLowerCase() === entry.name.toLowerCase() ? '#fff' : entry.color}
                          strokeWidth={primaryOutcome?.toLowerCase() === entry.name.toLowerCase() ? 3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value: string, entry: { payload?: { value?: number } }) => (
                        <span className="text-sm">
                          {value}: <span className="font-bold">{entry.payload?.value?.toFixed(1) || '0'}%</span>
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="bar" className="mt-4">
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="outcome" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      content={({ active, payload }: CustomTooltipProps & { payload?: Array<{ payload?: { outcome?: string }; value?: number }> }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-black/90 text-white p-3 rounded-lg border border-white/20 shadow-lg">
                              <p className="font-semibold">{data.payload?.outcome || 'Unknown'}</p>
                              <p className="text-sm opacity-90">
                                Confidence: <span className="font-bold">{data.value?.toFixed(1) || '0'}%</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="confidence"
                      radius={[8, 8, 0, 0]}
                    >
                      {barData.map((entry, index) => (
                        <Cell
                          key={`bar-cell-${index}`}
                          fill={entry.color}
                          stroke={primaryOutcome?.toLowerCase() === entry.outcome.toLowerCase() ? '#fff' : entry.color}
                          strokeWidth={primaryOutcome?.toLowerCase() === entry.outcome.toLowerCase() ? 2 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>

          <div className={`grid gap-4 ${outcomeEntries.length === 2 ? 'grid-cols-2' : outcomeEntries.length <= 4 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
            {outcomeEntries.map(([outcomeName, confidence], index) => {
              const confidenceValue = Number(confidence) || 0;
              const isPrimary = primaryOutcome?.toLowerCase() === outcomeName.toLowerCase();
              const color = getColorForOutcome(outcomeName, index);
              const isYes = outcomeName.toLowerCase() === 'yes';
              const isNo = outcomeName.toLowerCase() === 'no';
              
              // Determine border and background colors
              let borderColor = 'border-gray-300 dark:border-gray-700';
              let bgColor = 'bg-gray-50 dark:bg-gray-900';
              let textColor = 'text-gray-700 dark:text-gray-300';
              
              if (isPrimary) {
                if (isYes) {
                  borderColor = 'border-green-500';
                  bgColor = 'bg-green-500/10';
                  textColor = 'text-green-600 dark:text-green-400';
                } else if (isNo) {
                  borderColor = 'border-red-500';
                  bgColor = 'bg-red-500/10';
                  textColor = 'text-red-600 dark:text-red-400';
                } else {
                  // For other outcomes, use a generic primary style
                  borderColor = 'border-blue-500';
                  bgColor = 'bg-blue-500/10';
                  textColor = 'text-blue-600 dark:text-blue-400';
                }
              }

              return (
                <div
                  key={outcomeName}
                  className={`p-4 rounded-lg border-2 ${borderColor} ${bgColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${textColor}`}>{outcomeName}</span>
                    {isPrimary && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">PRIMARY</span>
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${textColor}`}>
                    {confidenceValue.toFixed(1)}%
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, confidenceValue))}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

