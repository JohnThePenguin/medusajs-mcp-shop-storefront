"use client";

import { useState, useEffect } from "react";
import { Button, Container, Heading, Input, Text } from "@medusajs/ui";
import { ArrowRight } from "@medusajs/icons";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);

  // Initialize cart on mount
  useEffect(() => {
    const storedCartId = localStorage.getItem("cart_id");
    if (!storedCartId) {
      // Create a new cart
      createCart();
    } else {
      setCartId(storedCartId);
    }
  }, []);

  const createCart = async () => {
    try {
      const response = await fetch("http://localhost:9000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "create_cart",
          arguments: {},
        }),
      });

      const data = await response.json();
      if (data.cart?.id) {
        localStorage.setItem("cart_id", data.cart.id);
        setCartId(data.cart.id);
      }
    } catch (error) {
      console.error("Failed to create cart:", error);
    }
  };

  const callTool = async (tool: string, args: any) => {
    const response = await fetch("http://localhost:9000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool,
        arguments: args,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Simple command parsing
      let response;
      let assistantMessage = "";

      if (userMessage.toLowerCase().includes("list products") || userMessage.toLowerCase().includes("show products")) {
        const searchMatch = userMessage.match(/search[:\s]+([^\s]+)/i);
        const search = searchMatch ? searchMatch[1] : undefined;

        response = await callTool("list_products", {
          search,
          limit: 5,
        });

        assistantMessage = `Found ${response.count} products:\n\n`;
        response.products.forEach((product: any) => {
          assistantMessage += `- ${product.title}\n`;
        });
      } else if (userMessage.toLowerCase().includes("show cart") || userMessage.toLowerCase().includes("view cart")) {
        if (!cartId) {
          assistantMessage = "No cart available. Creating one...";
          await createCart();
        } else {
          response = await callTool("list_cart_products", {
            cartId,
          });

          if (response.items.length === 0) {
            assistantMessage = "Your cart is empty.";
          } else {
            assistantMessage = `Cart contents (${response.total_items} items):\n\n`;
            response.items.forEach((item: any) => {
              assistantMessage += `- ${item.title} x${item.quantity}\n`;
            });
          }
        }
      } else if (userMessage.toLowerCase().includes("add to cart")) {
        // Example: "add to cart variant_123 quantity 2"
        const variantMatch = userMessage.match(/variant[_:]?\s*([^\s]+)/i);
        const quantityMatch = userMessage.match(/quantity[:\s]+(\d+)/i);

        if (!variantMatch) {
          assistantMessage = "Please specify a variant ID. Example: 'add to cart variant_123 quantity 2'";
        } else if (!cartId) {
          assistantMessage = "No cart available. Creating one...";
          await createCart();
        } else {
          response = await callTool("update_cart", {
            cartId,
            action: "add",
            variantId: variantMatch[1],
            quantity: quantityMatch ? parseInt(quantityMatch[1]) : 1,
          });

          assistantMessage = `Added item to cart successfully!`;
        }
      } else {
        assistantMessage = `I can help you with:
- "list products" or "show products"
- "show cart" or "view cart"
- "add to cart variant_ID quantity N"

Try one of these commands!`;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="max-w-3xl mx-auto">
        <Heading level="h1" className="mb-6">
          Shop Assistant
        </Heading>

        <div className="bg-ui-bg-subtle rounded-lg p-4 mb-4 h-[500px] overflow-y-auto">
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
                <Text
                  size="small"
                  className={message.role === "user" ? "text-ui-fg-on-color" : ""}
                >
                  {message.content}
                </Text>
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

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Type a command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !loading && handleSend()}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
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
