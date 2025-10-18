"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Container, Heading, Input, Text } from "@medusajs/ui";
import { ArrowRight } from "@medusajs/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { initializeCart } from "./actions";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatClientProps = {
  countryCode: string;
};

export default function ChatClient({ countryCode }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartInitialized, setCartInitialized] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize cart on mount
  useEffect(() => {
    const initCart = async () => {
      const result = await initializeCart(countryCode);
      if (result.success) {
        setCartId(result.cartId);
      }
      setCartInitialized(true);
    };
    initCart();
  }, [countryCode]);

  const sendMessage = async (userMessage: string) => {
    const response = await fetch("http://localhost:9000/store/chat", {
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
    const data = await response.json();
    if (data.response) {
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    }
  };

  const submit = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    await sendMessage(userMessage);
    setLoading(false);
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
        <Heading level="h1" className="mb-6">
          Shop Assistant
        </Heading>

        <div
          ref={containerRef}
          className="bg-ui-bg-subtle rounded-lg p-4 mb-4 h-[500px] overflow-y-auto"
        >
          {messages.length === 0 && (
            <Text className="text-ui-fg-muted">
              Welcome! Ask me to list products, show your cart, or add items to cart.
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
                  className={`text-small prose prose-sm max-w-none ${
                    message.role === "user"
                      ? "text-ui-fg-on-color prose-invert"
                      : "prose-slate"
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-left mb-4">
              <div className="inline-block p-3 rounded-lg bg-ui-bg-base border border-ui-border-base">
                <Text size="small" className="text-ui-fg-muted">
                  Thinking...
                </Text>
              </div>
            </div>
          )}
        </div>

        <div className="gap-2 w-full flex">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Type a command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && submit()}
              disabled={loading}
              style={{ flex: 1 }}
            />
          </div>
          <Button onClick={submit} disabled={loading || !input.trim()}>
            <ArrowRight />
          </Button>
        </div>

        {cartId && (
          <div className="mt-4 p-4 bg-ui-bg-subtle rounded-lg">
            <Text size="small" className="text-ui-fg-muted">
              Cart ID: {cartId}
            </Text>
          </div>
        )}
      </div>
    </Container>
  );
}
