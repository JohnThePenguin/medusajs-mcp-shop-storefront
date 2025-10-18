"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Container, Heading, Input, Text, Switch, Label } from "@medusajs/ui";
import { ArrowRight } from "@medusajs/icons";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { initializeCart, refreshCart } from "./actions";
import { Message, ChatResponse, TranscribeResponse } from "./types";
import { useAudioRecorder } from "./useAudioRecorder";
import VoiceRecorder from "./VoiceRecorder";
import AudioPlayer from "./AudioPlayer";

type ChatClientProps = {
  countryCode: string;
};

const BACKEND_URL = "http://localhost:9000";

function transformUrl(urlStr: string): string {
  const url = new URL(urlStr);
  let parts = url.pathname.split("/").filter(Boolean); // ['dk', 'chat']

  if (parts.length > 1) {
    // replace the last segment ('chat') with 'checkout'
    parts = [parts[0], 'checkout'];
  } else {
    // fallback if the URL doesn't have a second part
    parts.push("checkout");
  }

  url.pathname = "/" + parts.join("/");
  url.search = "?step=address";

  return url.toString();
}


export default function ChatClient({ countryCode }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const {
    isRecording,
    duration,
    error: recordingError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chat_messages");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (e) {
        console.error("Failed to load messages from localStorage", e);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chat_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Initialize cart on mount
  useEffect(() => {
    const initCart = async () => {
      const result = await initializeCart(countryCode);
      if (result.success) {
        setCartId(result.cartId);
      }
    };
    initCart();
  }, [countryCode]);

  // Show recording errors
  useEffect(() => {
    if (recordingError) {
      setError(recordingError);
      setTimeout(() => setError(null), 5000);
    }
  }, [recordingError]);

  const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
    try {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch(`${BACKEND_URL}/store/chat/transcribe`, {
        method: "POST",
        headers: {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data: TranscribeResponse = await response.json();
      return data.text;
    } catch (err) {
      setError("Failed to transcribe audio. Please try again.");
      console.error("Transcription error:", err);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  };

  const sendMessage = async (userMessage: string, includeVoice: boolean = false) => {
    try {
      const url = includeVoice
        ? `${BACKEND_URL}/store/chat?voice=true`
        : `${BACKEND_URL}/store/chat`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify({
          message: userMessage,
          cartId: cartId,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data: ChatResponse = await response.json();

      console.log("Chat response:", data);
      if(data.response.includes("Order created successfully")) {
          console.log("Redirecting to checkout...");
          console.log(transformUrl(document.location.href));
          document.location.href = transformUrl(document.location.href);
          return;
      };

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        audioUrl: data.audioFileName
          ? `${BACKEND_URL}/store/chat/audio/${data.audioFileName}`
          : undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh cart cache after backend may have modified it
      await refreshCart();
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error("Send message error:", err);
    }
  };

  const submit = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    setLoading(true);

    await sendMessage(userMessage, voiceMode);
    setLoading(false);
  };

  const handleRecordStop = async () => {
    try {
      const audioBlob = await stopRecording();

      // Transcribe the audio
      const transcribedText = await transcribeAudio(audioBlob);
      if (!transcribedText) return;

      // Add user message with transcribed text
      setMessages((prev) => [
        ...prev,
        { role: "user", content: transcribedText, timestamp: new Date() },
      ]);

      // Send to chat API with voice enabled
      setLoading(true);
      await sendMessage(transcribedText, true);
      setLoading(false);
    } catch (err) {
      setError("Failed to process voice recording");
      console.error("Voice recording error:", err);
    }
  };

  const clearChat = async () => {
    // Clear localStorage
    localStorage.removeItem("chat_messages");

    // Clear local state
    setMessages([]);
    setInput("");

    // Clear server-side conversation history
    try {
      await fetch(`${BACKEND_URL}/store/chat`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
      });
    } catch (error) {
      console.error("Failed to clear server conversation", error);
    }
  };

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Heading level="h1">Shop Assistant</Heading>

          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="small"
              onClick={clearChat}
              disabled={loading}
            >
              New Chat
            </Button>
            <div className="flex items-center gap-2">
              <Label htmlFor="voice-mode" className="text-small">
                Voice Mode
              </Label>
              <Switch
                id="voice-mode"
                checked={voiceMode}
                onCheckedChange={setVoiceMode}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-ui-tag-red-bg border border-ui-tag-red-border rounded-lg">
            <Text size="small" className="text-ui-tag-red-text">
              {error}
            </Text>
          </div>
        )}

        <div
          ref={containerRef}
          className="bg-ui-bg-subtle rounded-lg p-4 mb-4 h-[500px] overflow-y-auto"
        >
          {messages.length === 0 && (
            <Text className="text-ui-fg-muted">
              Welcome! Ask me to list products, show your cart, or add items to cart.
              {voiceMode && " Voice mode is enabled - you can speak or type!"}
            </Text>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${
                message.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg max-w-[80%] ${
                  message.role === "user"
                    ? "bg-ui-bg-interactive text-ui-fg-on-color"
                    : "bg-ui-bg-base border border-ui-border-base"
                }`}
              >
                <div
                  className={`prose prose-sm max-w-none ${
                    message.role === "user"
                      ? "prose-invert"
                      : "prose-slate"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <Link
                          href={props.href || "#"}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target={props.href?.startsWith("http") ? "_blank" : undefined}
                          rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          {props.children}
                        </Link>
                      ),
                      img: ({ node, ...props }) => (
                        <Image
                          src={props.src || ""}
                          alt={props.alt || "Product"}
                          width={200}
                          height={200}
                          className="rounded-md object-cover my-2"
                          unoptimized
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="text-sm mb-2 last:mb-0" {...props} style={message.role == "user" ? { color: "white" } : {}} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="text-sm list-disc list-inside mb-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="text-sm list-decimal list-inside mb-2" {...props} />
                      ),
                      code: ({ node, ...props }) => (
                        <code className="text-xs bg-ui-bg-subtle px-1 py-0.5 rounded" {...props} />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.audioUrl && (
                  <AudioPlayer audioUrl={message.audioUrl} autoPlay={voiceMode} />
                )}
              </div>
            </div>
          ))}

          {(loading || isTranscribing) && (
            <div className="text-left mb-4">
              <div className="inline-block p-3 rounded-lg bg-ui-bg-base border border-ui-border-base">
                <Text size="small" className="text-ui-fg-muted">
                  {isTranscribing ? "Transcribing..." : "Thinking..."}
                </Text>
              </div>
            </div>
          )}
        </div>

        {voiceMode && (
          <div className="mb-4">
            <VoiceRecorder
              isRecording={isRecording}
              duration={duration}
              onStart={startRecording}
              onStop={handleRecordStop}
              onCancel={cancelRecording}
              disabled={loading || isTranscribing}
            />
          </div>
        )}

        <div className="gap-2 w-full flex">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={
                voiceMode
                  ? "Type or use voice recording..."
                  : "Type a command..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && submit()}
              disabled={loading || isTranscribing || isRecording}
              style={{ flex: 1 }}
            />
          </div>
          <Button
            onClick={submit}
            disabled={loading || !input.trim() || isTranscribing || isRecording}
          >
            <ArrowRight />
          </Button>
        </div>

      </div>
    </Container>
  );
}
