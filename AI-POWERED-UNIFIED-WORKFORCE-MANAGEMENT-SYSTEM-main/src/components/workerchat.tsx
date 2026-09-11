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
            workerName: "Worker",
            department: "Operations",
            currentShift: "10:00 - 18:00",
          },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(async () => ({ error: await response.text() }));
        const serverError = errorPayload?.error || `Server returned status ${response.status}`;
        console.error("Server error response:", response.status, serverError);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${serverError}` },
        ]);
        return;
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
          content: error instanceof Error ? `Error: ${error.message}` : "Sorry, I am having trouble connecting right now. Please check your API key and server logs.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border overflow-hidden flex flex-col h-[600px]">
      
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">APEX</h3>
            <p className="text-white/80 text-xs">Your AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-2">
                Start a Conversation
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ask me anything about your work schedule, policies, 
                benefits, or contact information!
              </p>
              
              {/* Main Quick Start Questions */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setInput("What are my shift timings?")}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  📅 Shift Schedule
                </button>
                <button
                  onClick={() => setInput("How do I request time off?")}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  🏖️ Request Leave
                </button>
                <button
                  onClick={() => setInput("When do I get paid?")}
                  className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  💰 Pay Details
                </button>
                <button
                  onClick={() => setInput("What is the overtime policy?")}
                  className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  ⏰ Overtime Policy
                </button>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" 
                  ? "bg-gradient-to-br from-blue-600 to-purple-600" 
                  : "bg-gradient-to-br from-green-500 to-teal-500"
              }`}>
                <span className="text-white text-sm">
                  {msg.role === "user" ? "👤" : "🤖"}
                </span>
              </div>

              {/* Message Bubble */}
              <div className={`px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md"
                  : "bg-white shadow-md border text-gray-800 rounded-bl-md"
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="bg-white shadow-md border px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white px-5 py-4">
        <div className="flex gap-3">
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
            placeholder="Ask about shifts, leave, payroll, policies..."
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <span>{loading ? "..." : "Send"}</span>
            <span>🚀</span>
          </button>
        </div>

        {/* Action Shortcuts Below Search Bar */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Quick Actions:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setInput("How can I contact HR support?")}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              💡 HR Contact
            </button>
            <button
              onClick={() => setInput("How do I submit an expense claim?")}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              📝 Submit Expense
            </button>
            <button
              onClick={() => setInput("What are the workplace safety & emergency contacts?")}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              🚑 Emergency Info
            </button>
            <button
              onClick={() => setInput("Where can I download the company handbook?")}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              📄 Employee Handbook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}