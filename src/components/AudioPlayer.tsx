import React, { useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  currentTime: number;
  onSeek: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  onPlayingChange: (isPlaying: boolean) => void;
  isVideoFile?: boolean;
}

export function AudioPlayer({
  src,
  onTimeUpdate,
  onDurationChange,
  currentTime,
  onSeek,
  audioRef,
  onPlayingChange,
  isVideoFile = false,
}: AudioPlayerProps) {
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    
    const handleTimeUpdate = () => onTimeUpdate(audio.currentTime);
    const handleDurationChange = () => onDurationChange(audio.duration);
    const handlePlay = () => onPlayingChange(true);
    const handlePause = () => onPlayingChange(false);
    const handleEnded = () => onPlayingChange(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onTimeUpdate, onDurationChange, onPlayingChange, audioRef]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.5) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, audioRef]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  return (
    <div className="flex items-center gap-4">
      {!isVideoFile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="h-8 w-8"
        >
          {audioRef.current?.paused ? (
            <Play className="h-4 w-4" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </Button>
      )}
      <Slider
        value={[currentTime]}
        onValueChange={([value]) => onSeek(value)}
        max={audioRef.current?.duration || 100}
        step={0.001}
        className="flex-1"
      />
      <audio ref={audioRef} src={src} hidden />
    </div>
  );
} 