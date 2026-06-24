import { NextRequest } from "next/server";
import { getAI } from "@/lib/cloudflare";

const SYSTEM_PROMPT = `You are the FlyTripVisa AI Agent, a specialized technical assistant with full access to the project file system.

Your capabilities:
- Read, write, edit, and delete files in the project
- Create new components, API routes, and utilities
- Refactor and optimize existing code
- Execute development tasks

When you need to perform file operations, emit a tool call in this format:
<tool_call>{"id": "...", "type": "function", "function": {"name": "file_read|file_write|file_edit|file_delete|file_list|dir_create", "arguments": {"path": "...", "content": "..."}}}</tool_call>

Always provide clean, type-safe TypeScript code. Follow the existing project structure.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const ai = await getAI();

    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const stream = await ai.run("@cf/meta/llama-3.1-70b-instruct", {
      messages: formattedMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Cloudflare stream iterates directly as AsyncIterable
          for await (const chunk of stream as any) {
            const content = chunk.response || "";
            
            // টুল কল ডিটেকশন ও প্রসেসিং
            const toolCallMatch = content.match(/<tool_call>(.*?)<\/tool_call>/s);
            
            if (toolCallMatch) {
              const toolCallData = JSON.parse(toolCallMatch[1]);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_call", tool_call: toolCallData })}\n\n`));
            } else if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: (err as Error).message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" } 
    });
  }
}
