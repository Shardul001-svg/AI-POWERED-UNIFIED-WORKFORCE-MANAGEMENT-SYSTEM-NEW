"use client";

import { useState } from "react";

export default function WorkerChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          context: {
            workerName: "John Doe",
            department: "Customer Success",
            currentShift: "09:00 - 17:00",
          },
        }),
      });

      // Prevent JSON parsing crash if the server responds with an HTTP error or non-JSON body
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", response.status, errorText);
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I am having trouble connecting right now. Please check your API key and server logs.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 max-w-md mx-auto">
      <div className="h-64 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`p-2 rounded ${
              msg.role === "user"
                ? "bg-blue-500 text-white ml-auto max-w-[80%]"
                : "bg-gray-100 mr-auto max-w-[80%]"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <div className="text-gray-500 text-sm">AI is typing...</div>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void sendMessage();
            }
          }}
          placeholder="Ask about shifts, time-off, etc..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}