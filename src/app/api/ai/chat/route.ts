import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { tavily } from '@tavily/core';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { parsePolymarketUrl } from '@/lib/api/polymarket';
import { parseKalshiUrl } from '@/lib/api/kalshi';
import { parseSimmerUrl } from '@/lib/api/simmer';
import { fetchPolymarketMarketBySlug } from '@/lib/api/polymarket';
import { fetchKalshiMarketByTicker } from '@/lib/api/kalshi';
import { fetchSimmerMarketById } from '@/lib/api/simmer';
import { SYSTEM_PROMPT } from '@/lib/prompts/system-prompt';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

export async function POST(request: NextRequest) {
  try {
    const { message, threadId, history, marketContext } = await request.json();

    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      openAIApiKey: OPENAI_API_KEY,
    });

    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...history.map((msg: { role: string; content: string }) =>
        msg.role === 'user'
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
      new HumanMessage(message),
    ];

    let marketInfo = '';
    if (marketContext && marketContext.market) {
      const market = marketContext.market;
      const isPolymarket = marketContext.provider === 'polymarket';
      const isKalshi = marketContext.provider === 'kalshi';
      const isSimmer = marketContext.provider === 'simmer';
      
      const question = isPolymarket 
        ? (market as any).title || (market as any).question || 'Unknown market'
        : isKalshi
        ? (market as any).title || 'Unknown market'
        : (market as any).question || 'Unknown market';
      
      const description = isPolymarket
        ? (market as any).description
        : isKalshi
        ? (market as any).subtitle
        : (market as any).context || (market as any).resolution_criteria;
      
      marketInfo = `\n\nMARKET CONTEXT:\nQuestion: ${question}\nDescription: ${description || 'No description'}\nProvider: ${marketContext.provider}\n\nYou can analyze this market and provide insights. If the user wants a detailed signal, suggest they use the "Get AI Signal" button on the market details page.`;
    } else if (marketContext && marketContext.slug) {
      marketInfo = `\n\nMARKET CONTEXT:\nProvider: ${marketContext.provider}\nSlug: ${marketContext.slug}\n\nI can help analyze this market.`;
    }

    let response: string;

    const shouldSearch = TAVILY_API_KEY && (
      message.includes('?') || 
      message.includes('analyze') || 
      marketContext ||
      message.toLowerCase().includes('polymarket') ||
      message.toLowerCase().includes('kalshi') ||
      message.toLowerCase().includes('simmer') ||
      message.toLowerCase().includes('prediction')
    );

    if (shouldSearch) {
      const searchQuery = marketContext && marketContext.market
        ? `${(marketContext.market as any).title || (marketContext.market as any).question || ''} prediction market recent news twitter`
        : marketContext && marketContext.slug
        ? `prediction market ${marketContext.provider} ${marketContext.slug} recent news twitter`
        : message;

      try {
        const tavilyClient = tavily({ apiKey: TAVILY_API_KEY });
        const searchResults = await tavilyClient.search(searchQuery, {
          maxResults: 5,
          topic: 'news',
          includeAnswer: true,
        });
        
        const formattedResults = searchResults.results?.map((result: any, idx: number) => 
          `${idx + 1}. ${result.title}\n   URL: ${result.url}\n   Content: ${result.content}`
        ).join('\n\n') || '';
        
        const answer = searchResults.answer ? `\n\nDirect Answer: ${searchResults.answer}` : '';
        const searchContext = formattedResults + answer;

        messages.push(
          new SystemMessage(`Recent search results:\n${searchContext}${marketInfo}`)
        );
      } catch (error) {
        console.error('Search error:', error);
        if (marketInfo) {
          messages.push(new SystemMessage(marketInfo));
        }
      }
    } else if (marketInfo) {
      messages.push(new SystemMessage(marketInfo));
    }

    const response_ = await model.invoke(messages);
    response = response_.content as string;

    return NextResponse.json({
      response,
      threadId,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process message', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

