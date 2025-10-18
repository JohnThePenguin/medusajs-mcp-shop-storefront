"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Container, Heading, Input, Text } from "@medusajs/ui";
import { ArrowRight } from "@medusajs/icons";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("chat_messages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
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

  const sendMessage = async () => {
      const response = await fetch("http://localhost:9000/store/chat", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json", "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
        body: JSON.stringify({
          message: input,
        }),
      });
      const data = await response.json();
      if(data.response){
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      }
  };

  const submit = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    await sendMessage();
    setLoading(false);
  }

  const clearChat = async () => {
    // Clear localStorage
    localStorage.removeItem("chat_messages");

    // Clear local state
    setMessages([]);
    setInput("");

    // Clear server-side conversation history
    try {
      await fetch("http://localhost:9000/store/chat", {
        method: "DELETE",
        credentials: 'include',
        headers: { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" },
      });
    } catch (error) {
      console.error("Failed to clear server conversation", error);
    }
  }

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth", // or "auto" for instant scroll
    });
  }, [messages]);

  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Heading level="h1">
            Shop Assistant
          </Heading>
          <Button variant="secondary" size="small" onClick={clearChat} disabled={loading}>
            New Chat
          </Button>
        </div>

        <div ref={containerRef} className="bg-ui-bg-subtle rounded-lg p-4 mb-4 h-[500px] overflow-y-auto">
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
                  className={`prose prose-sm max-w-none ${
                    message.role === "user"
                      ? "prose-invert"
                      : "prose-slate"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      // Custom link renderer
                      a: ({ node, ...props }) => (
                        <Link
                          href={props.href || "#"}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target={props.href?.startsWith('http') ? '_blank' : undefined}
                          rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {props.children}
                        </Link>
                      ),
                      // Custom image renderer
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
                      // Custom paragraph renderer
                      p: ({ node, ...props }) => (
                        <p className="text-sm mb-2 last:mb-0" {...props} />
                      ),
                      // Custom list renderer
                      ul: ({ node, ...props }) => (
                        <ul className="text-sm list-disc list-inside mb-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="text-sm list-decimal list-inside mb-2" {...props} />
                      ),
                      // Custom code renderer
                      code: ({ node, ...props }) => (
                        <code className="text-xs bg-ui-bg-subtle px-1 py-0.5 rounded" {...props} />
                      ),
                    }}
                  >
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
          <div className="flex-1" >
          <Input
            type="text"
            placeholder="Type a command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !loading && submit()}
            disabled={loading}
            // className="flex-1"
            style={{flex: 1}}
          />
          </div>
          <Button onClick={submit} disabled={loading || !input.trim()}>
            <ArrowRight />
          </Button>
        </div>

        {/* <div className="mt-4 p-4 bg-ui-bg-subtle rounded-lg">
          <Text size="small" className="text-ui-fg-muted">
            Cart ID: {cartId || "Not created yet"}
          </Text>
        </div> */}
      </div>
    </Container>
  );
}
