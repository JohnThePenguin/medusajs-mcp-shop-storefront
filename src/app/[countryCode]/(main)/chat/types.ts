export interface Message {
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  timestamp?: Date;
}

export interface TranscribeResponse {
  text: string;
  cartId: string;
}

export interface ChatResponse {
  response: string;
  cartId: string;
  audioFileName?: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}
