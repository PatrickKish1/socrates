import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { tavily } from '@tavily/core';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PolymarketMarket } from '@/lib/api/polymarket';
import { KalshiMarket } from '@/lib/api/kalshi';
import { SimmerMarket } from '@/lib/api/simmer';
import { MARKET_ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompts/market-analysis-prompt';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

export async function POST(request: NextRequest) {
  try {
    const { market, provider } = await request.json();

    const isPolymarket = provider === 'polymarket';
    const isKalshi = provider === 'kalshi';
    const isSimmer = provider === 'simmer';
    
    const polymarketMarket = isPolymarket ? market as PolymarketMarket : null;
    const kalshiMarket = isKalshi ? market as KalshiMarket : null;
    const simmerMarket = isSimmer ? market as SimmerMarket : null;

    const question = isPolymarket 
      ? polymarketMarket?.title || polymarketMarket?.question || 'No question available'
      : isKalshi
      ? kalshiMarket?.title || 'No title available'
      : simmerMarket?.question || 'No question available';

    const description = isPolymarket
      ? polymarketMarket?.description
      : isKalshi
      ? kalshiMarket?.subtitle
      : simmerMarket?.context || simmerMarket?.resolution_criteria;

    let yesPrice = 0;
    let noPrice = 0;
    let bestBid = 0;
    let bestAsk = 0;
    let lastTradePrice = 0;
    let oneDayPriceChange = 0;
    let oneHourPriceChange = 0;

    if (isPolymarket && polymarketMarket) {
      if (polymarketMarket.markets && polymarketMarket.markets.length > 0) {
        const primaryMarket = polymarketMarket.markets[0];
        const outcomePrices = primaryMarket.outcomePrices || [];
        if (outcomePrices.length >= 2) {
          yesPrice = parseFloat(outcomePrices[0] || '0');
          noPrice = parseFloat(outcomePrices[1] || '0');
        }
        bestBid = primaryMarket.bestBid || 0;
        bestAsk = primaryMarket.bestAsk || 0;
        lastTradePrice = primaryMarket.lastTradePrice || 0;
        oneDayPriceChange = primaryMarket.oneDayPriceChange || 0;
        oneHourPriceChange = primaryMarket.oneHourPriceChange || 0;
      } else if (polymarketMarket.outcomes && polymarketMarket.outcomes.length >= 2) {
        yesPrice = polymarketMarket.outcomes[0]?.price || 0;
        noPrice = polymarketMarket.outcomes[1]?.price || 0;
      } else if (polymarketMarket.outcomePrices && polymarketMarket.outcomePrices.length >= 2) {
        yesPrice = parseFloat(polymarketMarket.outcomePrices[0] || '0');
        noPrice = parseFloat(polymarketMarket.outcomePrices[1] || '0');
      }
      bestBid = polymarketMarket.bestBid || bestBid;
      bestAsk = polymarketMarket.bestAsk || bestAsk;
      lastTradePrice = polymarketMarket.lastTradePrice || lastTradePrice;
      oneDayPriceChange = polymarketMarket.oneDayPriceChange || oneDayPriceChange;
      oneHourPriceChange = polymarketMarket.oneHourPriceChange || oneHourPriceChange;
    } else if (isKalshi && kalshiMarket) {
      yesPrice = kalshiMarket.yes_bid || 0;
      noPrice = kalshiMarket.no_bid || 0;
    } else if (isSimmer && simmerMarket) {
      // Simmer uses probability (0-1) for Yes, and 1 - probability for No
      yesPrice = simmerMarket.probability || 0;
      noPrice = 1 - (simmerMarket.probability || 0);
    }

    const volume = isPolymarket
      ? polymarketMarket?.volumeNum || polymarketMarket?.volume || 0
      : isKalshi
      ? kalshiMarket?.volume || 0
      : simmerMarket?.total_volume || 0;

    const volume24hr = isPolymarket
      ? polymarketMarket?.volume24hr || 0
      : 0;

    const liquidity = isPolymarket
      ? polymarketMarket?.liquidity || polymarketMarket?.liquidityClob || 0
      : isSimmer
      ? simmerMarket?.liquidity_param || 0
      : 0;

    const competitive = isPolymarket
      ? polymarketMarket?.competitive || 0
      : 0;

    const tags = isPolymarket && polymarketMarket?.tags
      ? polymarketMarket.tags.map(t => t.label).join(', ')
      : isSimmer && simmerMarket?.tags
      ? simmerMarket.tags.join(', ')
      : '';

    const resolutionSource = isPolymarket
      ? polymarketMarket?.resolutionSource
      : isSimmer
      ? simmerMarket?.resolution_criteria || ''
      : '';

    const endDate = isPolymarket
      ? polymarketMarket?.endDate
      : isKalshi
      ? kalshiMarket?.expiration_time
      : simmerMarket?.resolves_at;

    // Extract all outcomes from markets array using groupItemTitle
    // Only include ACTIVE markets
    const outcomesInfo = isPolymarket && polymarketMarket?.markets && polymarketMarket.markets.length > 0
      ? polymarketMarket.markets
          .filter((sub) => sub.groupItemTitle && sub.active !== false) // Only active markets with groupItemTitle
          .map((sub) => {
            const outcomePrices = Array.isArray(sub.outcomePrices)
              ? sub.outcomePrices
              : typeof sub.outcomePrices === 'string'
              ? JSON.parse(sub.outcomePrices)
              : [];
            
            return {
              outcomeName: sub.groupItemTitle || 'Unknown',
              question: sub.question,
              resolutionRule: sub.description || '', // CRITICAL: Resolution criteria/rule for this outcome
              yesPrice: outcomePrices.length > 0 ? parseFloat(outcomePrices[0] || '0') : 0,
              noPrice: outcomePrices.length > 1 ? parseFloat(outcomePrices[1] || '0') : 0,
              volume: sub.volumeNum || 0,
              liquidity: sub.liquidityNum || 0,
              startDate: sub.startDate,
              endDate: sub.endDate,
              bestBid: sub.bestBid || 0,
              bestAsk: sub.bestAsk || 0,
              lastTradePrice: sub.lastTradePrice || 0,
              oneDayChange: sub.oneDayPriceChange || 0,
              oneHourChange: sub.oneHourPriceChange || 0,
              competitive: sub.competitive || 0,
              volume24hr: sub.volume24hr || 0,
              active: sub.active !== false,
              resolutionSource: sub.resolutionSource || '',
            };
          })
      : isSimmer && simmerMarket
      ? [
          {
            outcomeName: 'Yes',
            question: simmerMarket.question,
            resolutionRule: simmerMarket.resolution_criteria || simmerMarket.context || '',
            yesPrice: simmerMarket.probability || 0,
            noPrice: 1 - (simmerMarket.probability || 0),
            volume: simmerMarket.total_volume || 0,
            liquidity: simmerMarket.liquidity_param || 0,
            startDate: simmerMarket.created_at,
            endDate: simmerMarket.resolves_at,
            bestBid: 0,
            bestAsk: 0,
            lastTradePrice: simmerMarket.probability || 0,
            oneDayChange: 0,
            oneHourChange: 0,
            competitive: 0,
            volume24hr: 0,
            active: simmerMarket.status === 'active',
            resolutionSource: simmerMarket.resolution_criteria || '',
          },
          {
            outcomeName: 'No',
            question: simmerMarket.question,
            resolutionRule: simmerMarket.resolution_criteria || simmerMarket.context || '',
            yesPrice: simmerMarket.probability || 0,
            noPrice: 1 - (simmerMarket.probability || 0),
            volume: simmerMarket.total_volume || 0,
            liquidity: simmerMarket.liquidity_param || 0,
            startDate: simmerMarket.created_at,
            endDate: simmerMarket.resolves_at,
            bestBid: 0,
            bestAsk: 0,
            lastTradePrice: 1 - (simmerMarket.probability || 0),
            oneDayChange: 0,
            oneHourChange: 0,
            competitive: 0,
            volume24hr: 0,
            active: simmerMarket.status === 'active',
            resolutionSource: simmerMarket.resolution_criteria || '',
          },
        ]
      : [];

    const marketData = {
      question,
      description: description || 'No description available',
      yesPrice: (yesPrice * 100).toFixed(2) + '%',
      noPrice: (noPrice * 100).toFixed(2) + '%',
      bestBid: bestBid > 0 ? (bestBid * 100).toFixed(2) + '%' : 'N/A',
      bestAsk: bestAsk > 0 ? (bestAsk * 100).toFixed(2) + '%' : 'N/A',
      lastTradePrice: lastTradePrice > 0 ? (lastTradePrice * 100).toFixed(2) + '%' : 'N/A',
      oneDayPriceChange: oneDayPriceChange !== 0 ? (oneDayPriceChange * 100).toFixed(2) + '%' : '0%',
      oneHourPriceChange: oneHourPriceChange !== 0 ? (oneHourPriceChange * 100).toFixed(2) + '%' : '0%',
      volume: `$${volume.toLocaleString()}`,
      volume24hr: volume24hr > 0 ? `$${volume24hr.toLocaleString()}` : 'N/A',
      liquidity: liquidity > 0 ? `$${liquidity.toLocaleString()}` : 'N/A',
      competitive: competitive > 0 ? (competitive * 100).toFixed(2) + '%' : 'N/A',
      tags: tags || 'None',
      resolutionSource: resolutionSource || 'Not specified',
      endDate: endDate || 'Not specified',
      outcomes: outcomesInfo,
      provider,
    };

    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      openAIApiKey: OPENAI_API_KEY,
    });

    const messages = [
      new SystemMessage(MARKET_ANALYSIS_SYSTEM_PROMPT),
      new HumanMessage(`Analyze this prediction market with all available data:

Question: ${marketData.question}
Description: ${marketData.description}
Provider: ${marketData.provider}
${marketData.resolutionSource ? `Main Resolution Source: ${marketData.resolutionSource}` : ''}

PRICING DATA:
- Yes Price: ${marketData.yesPrice}
- No Price: ${marketData.noPrice}
- Best Bid: ${marketData.bestBid}
- Best Ask: ${marketData.bestAsk}
- Last Trade Price: ${marketData.lastTradePrice}
- 24h Price Change: ${marketData.oneDayPriceChange}
- 1h Price Change: ${marketData.oneHourPriceChange}

MARKET METRICS:
- Total Volume: ${marketData.volume}
- 24h Volume: ${marketData.volume24hr}
- Liquidity: ${marketData.liquidity}
- Competitive Score: ${marketData.competitive}
- End Date: ${marketData.endDate}
- Resolution Source: ${marketData.resolutionSource}
- Tags: ${marketData.tags}

${marketData.outcomes.length > 0 ? `\n\nOUTCOMES (all possible outcomes for this market):\n${marketData.outcomes.map((outcome, idx) => `
${idx + 1}. ${outcome.outcomeName}${outcome.active ? '' : ' (INACTIVE)'}
   Question: ${outcome.question}
   **RESOLUTION RULE (CRITICAL)**: ${outcome.resolutionRule || 'No resolution rule specified'}
   ${outcome.resolutionSource ? `   Resolution Source: ${outcome.resolutionSource}` : ''}
   - Yes Price: ${(outcome.yesPrice * 100).toFixed(2)}% | No Price: ${(outcome.noPrice * 100).toFixed(2)}%
   - Volume: $${outcome.volume.toLocaleString()} | 24h Volume: $${outcome.volume24hr.toLocaleString()}
   - Liquidity: $${outcome.liquidity.toLocaleString()}
   - Best Bid: ${(outcome.bestBid * 100).toFixed(2)}% | Best Ask: ${(outcome.bestAsk * 100).toFixed(2)}%
   - Last Trade: ${(outcome.lastTradePrice * 100).toFixed(2)}%
   - 24h Price Change: ${(outcome.oneDayChange * 100).toFixed(2)}% | 1h Change: ${(outcome.oneHourChange * 100).toFixed(2)}%
   - Competitive Score: ${(outcome.competitive * 100).toFixed(2)}%
   - Start Date: ${outcome.startDate || 'N/A'} | End Date: ${outcome.endDate || 'N/A'}`).join('\n')}` : ''}

**CRITICAL INSTRUCTIONS:**

1. **INDEPENDENT ANALYSIS REQUIRED**: The market prices shown above reflect what PEOPLE are betting, not absolute truth. You must conduct YOUR OWN research and make YOUR OWN independent assessment. Do NOT simply mirror the market prices - analyze the underlying facts and provide YOUR prediction.

2. **For Multi-Outcome Markets**: If this market has multiple outcomes (like "NVIDIA", "Microsoft", "Apple", etc.), you MUST:
   - Specify which SPECIFIC outcome you predict will win (e.g., "NVIDIA" not just "Yes")
   - Provide YOUR OWN confidence percentages for EACH outcome based on YOUR research
   - Explain why the market-leading outcome (highest price) is leading based on facts
   - Consider if a different outcome might actually win despite lower market prices
   - Analyze each outcome independently based on recent news, trends, and fundamentals

3. **RESOLUTION RULES ARE CRITICAL - THIS IS YOUR VALIDATION FRAMEWORK**: 
   
   Each outcome has a specific resolution rule (shown in the "RESOLUTION RULE" field) that defines EXACTLY how it resolves. This is the most important information for your analysis. You MUST:
   - **READ AND UNDERSTAND** the resolution rule for each outcome - this is your validation framework
   - **IDENTIFY THE KEY METRICS/DATA** required by the resolution rule (e.g., "market cap", "by specific date", "specific event")
   - **SEARCH FOR DATA** that directly validates against the resolution criteria
   - **VALIDATE YOUR PREDICTION** against the resolution rule - does your predicted outcome meet the criteria?
   
   **EXAMPLES OF RULE-DRIVEN RESEARCH**:
   
   - **If rule says**: "resolves to Yes if NVIDIA is the largest company by market cap on December 31, 2025, as of market close"
     * You MUST search for: Current market cap for NVIDIA, Microsoft, Apple, and all other companies in the market
     * You MUST search for: Market cap trends, growth projections, and forecasts to December 31, 2025
     * You MUST search for: Recent market cap changes, company performance, industry dynamics
     * You MUST analyze: Which company is most likely to have the highest market cap by the resolution date
     * You MUST validate: Does your predicted outcome meet the "largest by market cap" criteria?
   
   - **If rule mentions**: "as of market close" → understand market close timing and search for data at that time
   - **If rule mentions**: specific dates → search for projections, trends, and data relevant to those dates
   - **If rule mentions**: specific events → search for likelihood and information about those events
   - **If rule mentions**: specific metrics (revenue, users, votes, etc.) → search for those exact metrics
   
   - The resolution rule is your VALIDATION FRAMEWORK - your prediction must align with what the rule requires

4. **Research Requirements**: Based on the resolution rules, search for relevant information:
   - **Data that directly validates the resolution criteria** (e.g., market cap if rule mentions market cap)
   - Latest news articles and developments for EACH outcome
   - Twitter/X posts and social media sentiment
   - Fundamental analysis of why each outcome could win
   - Recent events that could shift probabilities
   - Any metrics, data points, or facts mentioned in the resolution rules
   - Any breaking news or announcements

5. **Market Data Context**: Use the provided market data as context:
   - Market prices show what traders think, but evaluate if they're correct
   - Volume and liquidity indicate market interest, not necessarily accuracy
   - Price changes (24h, 1h) show sentiment shifts - investigate WHY
   - Competitive scores reflect market confidence, but verify with research
   - Consider that prices can change rapidly - focus on underlying fundamentals

6. **Your Analysis Must Include**:
   - Which specific outcome you predict (for multi-outcome markets, name it explicitly)
   - **VALIDATION AGAINST RESOLUTION RULES**: Explain how your predicted outcome meets (or is likely to meet) the resolution criteria from the rule
   - YOUR confidence percentages for ALL outcomes (based on YOUR research and rule validation, not just market prices)
   - Detailed reasoning explaining:
     * **How the resolution rule guides your analysis** - what data did you search for based on the rule?
     * **Validation against resolution criteria** - does your predicted outcome meet the rule's requirements?
     * Why the market-leading outcome is leading (based on facts and rule validation, not just prices)
     * Why you selected your predicted outcome (even if different from market leader) - validate against the rule
     * Recent developments that support your prediction and align with resolution criteria
     * Factors that could change the outcome and affect rule validation
     * How market sentiment aligns or misaligns with fundamentals and resolution requirements
   - Comparative analysis explaining why other outcomes are less likely, including:
     * How other outcomes fail to meet (or are less likely to meet) the resolution criteria
     * Why the data supports your predicted outcome over alternatives based on the rules

Then provide:
1. Your primary prediction (for multi-outcome markets: specify the outcome name, e.g., "NVIDIA" or "Microsoft")
2. Your confidence level (0-100%) for the selected outcome (YOUR assessment, not market price)
3. Confidence levels for ALL other outcomes (must sum to 100% total)
4. Detailed reasoning explaining why you selected the primary outcome, including:
   - **How the resolution rule guided your research** - what specific data did you search for?
   - **Validation against resolution criteria** - how does your predicted outcome meet the rule's requirements?
   - Why the current market prices suggest this outcome (but validate with your own research)
   - How recent price changes affect your prediction
   - What the volume and liquidity data tells you
   - Relevant news or events that support your conclusion AND align with resolution criteria
   - Any risks or factors that could change the outcome and affect rule validation
5. Comparative analysis explaining why other outcomes are less likely, including:
   - **How other outcomes fail to meet the resolution criteria** based on your research
   - Specific reasons why each alternative outcome is unlikely to meet the resolution rule
   - Evidence from research that contradicts alternative outcomes meeting the criteria
   - Market signals that favor your selected outcome over alternatives
   - Why the data validates your predicted outcome against the resolution rule better than alternatives

Format your response as JSON:

**For multi-outcome markets** (markets with named outcomes like "NVIDIA", "Microsoft", "Apple"):
{
  "outcome": "NVIDIA",  // Use the SPECIFIC outcome name you predict will win
  "confidence": 75,     // YOUR confidence in this outcome (not market price)
  "outcomes": {
    "NVIDIA": 75,
    "Microsoft": 15,
    "Apple": 10
    // Include ALL outcomes with YOUR confidence percentages
  },
  "reasoning": "Detailed explanation for why you selected this outcome, including facts, research findings, and analysis",
  "comparativeAnalysis": "Independent detailed explanation of why other outcomes are less likely, based on your research"
}

**For binary markets** (Yes/No only):
{
  "outcome": "yes" or "no",
  "confidence": number between 0 and 100,
  "outcomes": {
    "yes": number between 0 and 100,
    "no": number between 0 and 100
  },
  "reasoning": "detailed explanation for selected outcome",
  "comparativeAnalysis": "detailed explanation of why other outcomes are less likely"
}

IMPORTANT: 
- The "outcomes" object must contain confidence percentages for ALL outcomes that sum to 100% total
- Your confidence percentages should reflect YOUR analysis, not just market prices
- For multi-outcome markets, use the specific outcome name (e.g., "NVIDIA") not "yes" or "no"`),
    ];

    let searchContext = '';
    if (TAVILY_API_KEY) {
      try {
        const tavilyClient = tavily({ apiKey: TAVILY_API_KEY });
        const searchResults = await tavilyClient.search(
          `${marketData.question} prediction market recent news twitter`,
          {
            maxResults: 5,
            topic: 'news',
            includeAnswer: true,
          }
        );
        
        // Format search results for the LLM
        const formattedResults = searchResults.results?.map((result: any, idx: number) => 
          `${idx + 1}. ${result.title}\n   URL: ${result.url}\n   Content: ${result.content}`
        ).join('\n\n') || '';
        
        const answer = searchResults.answer ? `\n\nDirect Answer: ${searchResults.answer}` : '';
        searchContext = formattedResults + answer;
        
        if (searchContext) {
          messages.push(
            new SystemMessage(`Recent search results:\n${searchContext}`)
          );
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }

    const response_ = await model.invoke(messages);
    const result = { output: response_.content as string };

    let parsedResult;
    try {
      const jsonMatch = result.output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      const isYes = result.output.toLowerCase().includes('yes');
      parsedResult = {
        outcome: isYes ? 'yes' : 'no',
        confidence: 50,
        outcomes: {
          yes: isYes ? 50 : 50,
          no: isYes ? 50 : 50,
        },
        reasoning: result.output,
        comparativeAnalysis: 'Analysis completed',
      };
    }

    const primaryOutcome = parsedResult.outcome || 'no';
    const primaryConfidence = parsedResult.confidence || parsedResult.outcomes?.[primaryOutcome] || 50;
    
    const outcomes = parsedResult.outcomes || {
      yes: primaryOutcome === 'yes' ? primaryConfidence : 100 - primaryConfidence,
      no: primaryOutcome === 'no' ? primaryConfidence : 100 - primaryConfidence,
    };

    const total = outcomes.yes + outcomes.no;
    if (total !== 100) {
      const scale = 100 / total;
      outcomes.yes = Math.round(outcomes.yes * scale);
      outcomes.no = Math.round(outcomes.no * scale);
    }

    return NextResponse.json({
      outcome: primaryOutcome,
      confidence: primaryConfidence,
      outcomes,
      reasoning: parsedResult.reasoning || 'Analysis completed',
      comparativeAnalysis: parsedResult.comparativeAnalysis || 'Comparative analysis completed',
    });
  } catch (error) {
    console.error('Error analyzing market:', error);
    return NextResponse.json(
      { error: 'Failed to analyze market', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

