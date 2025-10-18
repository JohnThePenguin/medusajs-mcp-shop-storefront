"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@medusajs/ui";

// Simple play icon
const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

// Simple pause icon
const PauseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({
  audioUrl,
  autoPlay = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch audio with headers and create blob URL
  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchAudio = async () => {
      try {
        const response = await fetch(audioUrl, {
          headers: {
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch audio");
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (error) {
        console.error("Error fetching audio:", error);
      }
    };

    fetchAudio();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !blobUrl) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    const handleCanPlay = () => {
      if (autoPlay) {
        audio.play().then(() => setIsPlaying(true)).catch((err) => {
          console.error("Autoplay failed:", err);
        });
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [blobUrl, autoPlay]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-ui-bg-subtle rounded-lg mt-2">
      <Button
        onClick={togglePlay}
        size="small"
        variant="transparent"
        className="flex items-center justify-center w-8 h-8"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </Button>

      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 bg-ui-bg-base rounded-lg appearance-none cursor-pointer accent-ui-fg-interactive"
          style={{
            background: `linear-gradient(to right, var(--fg-interactive) 0%, var(--fg-interactive) ${
              (currentTime / duration) * 100
            }%, var(--bg-base) ${(currentTime / duration) * 100}%, var(--bg-base) 100%)`,
          }}
        />
        <span className="text-xs text-ui-fg-muted min-w-[45px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {blobUrl && <audio ref={audioRef} src={blobUrl} />}
    </div>
  );
}
