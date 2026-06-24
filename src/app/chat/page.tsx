"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, MessageRole, ToolCall } from "@/types/chat";
import { FileOperation } from "@/types/file-ops";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Send message with streaming
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: MessageRole.USER,
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: MessageRole.ASSISTANT,
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      let fullContent = "";
      let toolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // Handle different event types
              if (parsed.type === "content") {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              } else if (parsed.type === "tool_call") {
                toolCalls.push(parsed.tool_call);
                // Execute tool call immediately
                await executeToolCall(parsed.tool_call);
              } else if (parsed.type === "error") {
                throw new Error(parsed.error);
              }
            } catch {
              // Handle plain text chunks
              fullContent += data;
              setStreamingContent(fullContent);
            }
          }
        }
      }

      // Finalize message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: fullContent,
                isStreaming: true,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              }
            : m
        )
      );
      setStreamingContent("");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: `❌ Error: ${(err as Error).message}`,
                  isStreaming: true,
                }
              : m
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Execute tool calls (file operations)
  const executeToolCall = async (toolCall: ToolCall) => {
    try {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toolCall),
      });

      const result = await response.json();

      // Send tool result back to AI
      const toolResultMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: MessageRole.TOOL,
        content: JSON.stringify(result),
        timestamp: Date.now(),
        toolCallId: toolCall.id,
      };

      setMessages((prev) => [...prev, toolResultMessage]);

      // Continue streaming with tool result
      await continueWithToolResult(toolResultMessage);
    } catch (err) {
      console.error("Tool execution failed:", err);
    }
  };

  // Continue conversation after tool execution
  const continueWithToolResult = async (toolResult: ChatMessage) => {
    // This triggers another stream with the tool result context
    // The AI will incorporate the result into its response
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setStreamingContent("");
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center animate-pulse-glow">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">FlyTripVisa</h1>
            <p className="text-xs text-gray-400">AI Agent — Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
          <span className="text-xs text-gray-400">
            {isLoading ? "Thinking..." : "Ready"}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Welcome to FlyTripVisa AI</h2>
              <p className="text-gray-400 mt-2 max-w-md">
                Your real-time development assistant. Ask me to build, edit, refactor, or manage your project files.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-md w-full">
              {[
                "Create a new API route",
                "Refactor the chat component",
                "Add authentication",
                "Optimize performance",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-left px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-blue-500/50 hover:bg-[var(--surface-hover)] transition-all text-sm text-gray-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex gap-4 animate-slide-up ${message.role === MessageRole.USER ? "justify-end" : "justify-start"}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 ${
                message.role === MessageRole.USER
                  ? "bg-blue-600 text-white"
                  : message.role === MessageRole.TOOL
                  ? "bg-purple-600/20 border border-purple-500/30 text-purple-200"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {message.role === MessageRole.TOOL && (
                <div className="flex items-center gap-2 mb-2 text-xs text-purple-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Tool Result
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                {message.isStreaming ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-sm text-gray-400">AI is thinking...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}

                {/* Tool calls display */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.toolCalls.map((tc) => (
                      <div key={tc.id} className="bg-black/30 rounded-lg p-3 text-xs">
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {tc.function.name}
                        </div>
                        <pre className="text-gray-400">{JSON.stringify(tc.function.arguments, null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right mt-1">
                <span className="text-[10px] text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Streaming content */}
        {streamingContent && (
          <div className="flex gap-4 justify-start">
            <div className="max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 bg-[var(--surface)] border border-[var(--border)]">
              <div className="whitespace-pre-wrap">{streamingContent}</div>
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-middle" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to build, edit, or manage your project..."
              rows={1}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              disabled={isLoading}
            />
            <button
              onClick={() => setInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              {input && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex gap-2">
            {isLoading ? (
              <button
                onClick={cancelStream}
                className="px-4 py-3 rounded-xl bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-600 mt-2">
          FlyTripVisa AI can make mistakes. Review all code before applying.
        </p>
      </div>
    </div>
  );
}
