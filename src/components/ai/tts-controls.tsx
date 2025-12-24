'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TTSControlsProps {
  text: string;
  className?: string;
}

export function TTSControls({ text, className }: TTSControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Extract plain text from markdown for better TTS
  const extractPlainText = (markdownText: string): string => {
    return markdownText
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
  };

  const handlePlayPause = async () => {
    if (isPlaying && audioRef.current) {
      // Pause
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && currentAudioUrlRef.current) {
      // Resume
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Generate new audio
    setIsLoading(true);
    try {
      const plainText = extractPlainText(text);
      
      if (!plainText || plainText.length < 10) {
        throw new Error('Text too short for TTS');
      }

      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: plainText,
          speed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      // Create blob URL from audio data
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cleanup previous audio URL
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      currentAudioUrlRef.current = audioUrl;

      // Create audio element
      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      audio.volume = isMuted ? 0 : 1;

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setIsLoading(false);
      });

      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('play', () => {
        setIsPlaying(true);
        setIsLoading(false);
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);
        setIsLoading(false);
      });

      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (newSpeed: number[]) => {
    const newSpeedValue = newSpeed[0];
    setSpeed(newSpeedValue);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeedValue;
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : 1;
    }
  };

  if (!text || text.trim().length === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-3 p-2 bg-muted rounded-lg', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePlayPause}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleMuteToggle}
        className="h-8 w-8 p-0"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>

      <div className="flex items-center gap-2 flex-1 min-w-[120px]">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Speed:</span>
        <Slider
          value={[speed]}
          onValueChange={handleSpeedChange}
          min={0.5}
          max={2.0}
          step={0.1}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">
          {speed.toFixed(1)}x
        </span>
      </div>
    </div>
  );
}

