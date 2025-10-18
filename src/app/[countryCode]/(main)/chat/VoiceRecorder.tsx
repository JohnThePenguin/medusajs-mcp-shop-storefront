"use client";

import { Button } from "@medusajs/ui";
import { XMark } from "@medusajs/icons";

interface VoiceRecorderProps {
  isRecording: boolean;
  duration: number;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

// Simple microphone SVG icon
const MicrophoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

// Simple stop icon
const StopIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export default function VoiceRecorder({
  isRecording,
  duration,
  onStart,
  onStop,
  onCancel,
  disabled = false,
}: VoiceRecorderProps) {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const remainingMs = Math.floor((ms % 1000) / 100);
    return `${seconds}.${remainingMs}s`;
  };

  if (!isRecording) {
    return (
      <Button
        onClick={onStart}
        disabled={disabled}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <MicrophoneIcon />
        Record Voice
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-ui-bg-subtle rounded-lg border-2 border-ui-tag-red-border animate-pulse">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-3 h-3 bg-ui-tag-red-icon rounded-full animate-pulse" />
        <span className="text-small font-medium text-ui-fg-base">
          Recording... {formatDuration(duration)}
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onCancel}
          variant="secondary"
          size="small"
          className="flex items-center gap-1"
        >
          <XMark className="w-4 h-4" />
          Cancel
        </Button>
        <Button
          onClick={onStop}
          variant="primary"
          size="small"
          className="flex items-center gap-1"
        >
          <StopIcon />
          Stop
        </Button>
      </div>
    </div>
  );
}
