import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

export async function POST(request: NextRequest) {
  try {
    const { text, speed = 1.0 } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Clean text - remove markdown formatting for better TTS
    const cleanText = text
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/[-*]\s+/g, '') // Remove list markers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
      .replace(/\n{2,}/g, '. ') // Replace multiple newlines with period
      .replace(/\n/g, ' ') // Replace single newlines with space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/For a more comprehensive analysis[^.]*\./gi, '') // Remove "Get AI Signal" text
      .trim();

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // or 'tts-1-hd' for higher quality
        input: cleanText,
        voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
        speed: Math.max(0.25, Math.min(4.0, speed)), // Clamp speed between 0.25 and 4.0
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS error:', error);
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: response.status }
      );
    }

    // Get audio data as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Return audio as MP3
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

