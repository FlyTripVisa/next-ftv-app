export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
  TOOL = "tool",
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ChatRequest {
  messages: Array<{
    role: string;
    content: string;
  }>;
}

export interface StreamEvent {
  type: "content" | "tool_call" | "error" | "done";
  content?: string;
  tool_call?: ToolCall;
  error?: string;
}
