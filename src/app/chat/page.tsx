"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! আমি FlyTripVisa AI। আজকের ভিসা, ফ্লাইট, হোটেল বা ট্রাভেল প্ল্যান নিয়ে কীভাবে সাহায্য করতে পারি?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize Voice Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "bn-BD";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: messageText,
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const data = await response.json();
      const aiMessage: Message = {
        role: "assistant",
        content: data.response || "দুঃখিত, কোনো উত্তর পাওয়া যায়নি।",
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ সংযোগ সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("ভয়েস রেকগনিশন আপনার ব্রাউজারে সাপোর্টেড নয়।");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="main-wrapper" style={{ maxWidth: "500px", margin: "0 auto", width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="glass-header">
        <div className="logo-text">✈ FlyTripVisa <span className="ai-badge">AI ✦ D1</span></div>
        <a href="/admin" style={{ background: "#1a1a1f", border: "1px solid #333", color: "#fff", padding: "3px 10px", borderRadius: "10px", fontSize: "10px", cursor: "pointer", textDecoration: "none" }}>
          Admin
        </a>
      </header>

      {/* Chat Container */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "15px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          scrollBehavior: "smooth",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              padding: "10px 14px",
              borderRadius: "16px",
              maxWidth: "85%",
              fontSize: "14px",
              lineHeight: "1.4",
              wordBreak: "break-word",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#ff5500" : "#15151a",
              color: msg.role === "user" ? "#000" : "#eee",
              fontWeight: msg.role === "user" ? "600" : "400",
              border: msg.role === "assistant" ? "1px solid #2a2a2f" : "none",
            }}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "16px",
              maxWidth: "85%",
              fontSize: "14px",
              background: "#15151a",
              alignSelf: "flex-start",
              border: "1px solid #2a2a2f",
              color: "#888",
            }}
          >
            ⏳ চিন্তা করছি...
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "8px",
          background: "#09090c",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          borderTop: "1px solid #222",
          flexShrink: 0,
        }}
      >
        <button
          style={{
            background: "#1a1a1f",
            border: "1px solid #333",
            color: "#ff5500",
            padding: "8px",
            borderRadius: "50%",
            cursor: "pointer",
            width: "36px",
            height: "36px",
            flexShrink: 0,
            fontSize: "14px",
          }}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          📎
        </button>
        <input type="file" id="fileInput" style={{ display: "none" }} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="আপনার প্রশ্ন লিখুন..."
          style={{
            flex: 1,
            background: "#111",
            border: "1px solid #333",
            borderRadius: "18px",
            padding: "8px 12px",
            color: "#fff",
            outline: "none",
            fontSize: "14px",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={toggleVoice}
          style={{
            background: isListening ? "#ff5500" : "#1a1a1f",
            border: isListening ? "none" : "1px solid #333",
            color: isListening ? "#000" : "#ff5500",
            padding: "8px",
            borderRadius: "50%",
            cursor: "pointer",
            width: "36px",
            height: "36px",
            flexShrink: 0,
            fontSize: "14px",
            animation: isListening ? "pulse 1.5s infinite" : "none",
          }}
        >
          🎙️
        </button>
        <button
          onClick={() => handleSend()}
          disabled={isLoading}
          style={{
            background: "#ff5500",
            border: "none",
            color: "#000",
            padding: "8px 16px",
            borderRadius: "18px",
            fontWeight: "800",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "14px",
            flexShrink: 0,
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          পাঠান
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}