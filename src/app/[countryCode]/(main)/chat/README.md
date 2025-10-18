# Voice Chat Component - Implementation Guide

## Overview

This is a complete voice-enabled chat interface for your Medusa e-commerce store. It supports both text and voice interactions with an AI shopping assistant.

## Features

- ✅ Voice recording with visual feedback
- ✅ Speech-to-text transcription (ElevenLabs STT)
- ✅ Text-to-speech responses (ElevenLabs TTS)
- ✅ Regular text chat (keyboard input)
- ✅ Message history with markdown support
- ✅ Audio playback controls
- ✅ Cart integration and auto-refresh
- ✅ Error handling and loading states
- ✅ Mobile responsive design

## Files Created

```
src/app/[countryCode]/(main)/chat/
├── types.ts                    # TypeScript interfaces
├── useAudioRecorder.ts         # Audio recording hook
├── VoiceRecorder.tsx           # Voice recording UI component
├── AudioPlayer.tsx             # Audio playback component
├── chat-client-voice.tsx       # Main chat component with voice
├── chat-client.tsx             # Original text-only chat (preserved)
└── README.md                   # This file
```

## Usage

### Option 1: Replace Existing Chat with Voice Chat

Update `page.tsx` to use the voice-enabled version:

```typescript
import ChatClient from "./chat-client-voice"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  return <ChatClient countryCode={countryCode} />
}
```

### Option 2: Keep Both Versions

You can keep both `chat-client.tsx` (text-only) and `chat-client-voice.tsx` (voice-enabled) and switch between them as needed.

## Backend Requirements

Make sure your backend has these endpoints implemented:

1. **POST /store/chat/transcribe**
   - Accepts: FormData with 'audio' field
   - Returns: `{ text: string, cartId: string }`

2. **POST /store/chat?voice=true**
   - Accepts: `{ message: string, cartId: string }`
   - Returns: `{ response: string, cartId: string, audioUrl?: string }`

3. **GET /store/chat/audio/{filename}**
   - Returns: MP3 audio stream

## How It Works

### Voice Mode Flow

1. User toggles "Voice Mode" switch
2. User clicks "Record Voice" button
3. Browser requests microphone permission
4. Recording starts with visual feedback (pulsing red dot + timer)
5. User clicks "Stop" or auto-stops at 60 seconds
6. Audio is uploaded to `/store/chat/transcribe`
7. Transcribed text appears as user message
8. Message sent to `/store/chat?voice=true`
9. AI response displayed with audio player
10. Audio auto-plays (if voice mode enabled)
11. Cart cache refreshed automatically

### Text Mode Flow

1. User types message in input field
2. Presses Enter or clicks send button
3. Message sent to `/store/chat`
4. AI response displayed
5. Cart cache refreshed automatically

## Components

### `useAudioRecorder` Hook

Custom React hook for managing audio recording:

```typescript
const {
  isRecording,      // boolean: recording state
  duration,         // number: recording duration in ms
  error,            // string | null: error message
  startRecording,   // () => Promise<void>
  stopRecording,    // () => Promise<Blob>
  cancelRecording,  // () => void
} = useAudioRecorder();
```

**Features:**
- Automatic codec detection (WebM → OGG → MP4)
- 60-second max recording
- Duration tracking
- Error handling
- Microphone permission management

### `VoiceRecorder` Component

UI component for voice recording controls:

```typescript
<VoiceRecorder
  isRecording={boolean}
  duration={number}
  onStart={() => void}
  onStop={() => void}
  onCancel={() => void}
  disabled={boolean}
/>
```

**States:**
- **Not Recording**: Shows "Record Voice" button
- **Recording**: Shows pulsing red indicator, timer, Cancel and Stop buttons

### `AudioPlayer` Component

Audio playback component with controls:

```typescript
<AudioPlayer
  audioUrl={string}
  autoPlay={boolean}
/>
```

**Features:**
- Play/Pause button
- Seek bar
- Time display (current / total)
- Auto-play support

## Styling

Uses Medusa UI components and Tailwind CSS:
- Responsive design
- Pulsing animation for recording
- Color-coded message bubbles
- Error states with visual feedback
- Loading indicators

## Error Handling

The component handles:
- ❌ Microphone permission denied
- ❌ Recording failed
- ❌ Transcription failed
- ❌ Network errors
- ❌ Invalid responses

All errors display user-friendly messages for 5 seconds.

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (may use different audio codec)
- Mobile browsers: ✅ Supported (with permissions)

## Configuration

Edit these constants in `chat-client-voice.tsx`:

```typescript
const BACKEND_URL = "http://localhost:9000";  // Your backend URL
const MAX_RECORDING_DURATION = 60000;         // Max recording time (ms)
```

## TypeScript Types

All types are defined in `types.ts`:

```typescript
interface Message {
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  timestamp?: Date;
}

interface ChatResponse {
  response: string;
  cartId: string;
  audioUrl?: string;
}

interface TranscribeResponse {
  text: string;
  cartId: string;
}
```

## Keyboard Shortcuts

- **Enter**: Send text message (when input is focused)
- **Spacebar**: Could be added for push-to-talk (future enhancement)

## Future Enhancements

Possible improvements:
- Voice activity detection (auto-stop when silent)
- Transcript editing before sending
- Voice selection (different AI voices)
- Download conversation transcript
- Dark mode support
- Waveform visualization during recording
- Keyboard shortcut (spacebar to record)

## Troubleshooting

### Microphone not working
1. Check browser permissions
2. Ensure HTTPS (required for getUserMedia on non-localhost)
3. Check browser console for errors

### Audio not playing
1. Check browser autoplay policy
2. Verify backend audio URL is accessible
3. Check CORS settings on backend

### Transcription failing
1. Verify backend /store/chat/transcribe endpoint
2. Check audio format compatibility
3. Review backend logs for errors

### Cart not updating
1. Ensure `refreshCart()` is called after chat responses
2. Verify cart cache tags are configured correctly
3. Check backend cart modification logic

## Support

For issues or questions:
- Review browser console for errors
- Check backend API responses
- Verify all endpoints are accessible
- Test with text-only mode first, then enable voice

## License

Part of your Medusa e-commerce storefront.
