import { NextRequest } from "next/server";
import { getAI } from "@/lib/cloudflare";

// System prompt for the AI agent
const SYSTEM_PROMPT = `You are the FlyTripVisa AI Agent, a specialized technical assistant with full access to the project file system.

Your capabilities:
- Read, write, edit, and delete files in the project
- Create new components, API routes, and utilities
- Refactor and optimize existing code
- Execute development tasks

When you need to perform file operations, emit a tool call in this format:
<tool_call>{"id": "...", "type": "function", "function": {"name": "file_read|file_write|file_edit|file_delete|file_list|dir_create", "arguments": {"path": "...", "content": "..."}}}</tool_call>

Always provide clean, type-safe TypeScript code. Use modern React patterns (Server Components, Client Components with "use client", hooks). Follow the existing project structure.

Current project structure:
- src/app/ — Next.js App Router pages
- src/app/api/ — API routes
- src/components/ — Reusable React components
- src/lib/ — Utility functions
- src/types/ — TypeScript type definitions
- public/ — Static assets`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const ai = await getAI();

    // Format messages for Cloudflare Workers AI
    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Create streaming response using Workers AI
    const stream = await ai.run("@cf/meta/llama-3.1-70b-instruct", {
      messages: formattedMessages,
      stream: true,
    });

    // Transform Workers AI stream to SSE format
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = stream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }

            // Parse the chunk and forward as SSE
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim());

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);

                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.response || "";

                  // Check for tool calls in the response
                  const toolCallMatch = content.match(/<tool_call>(.*?)<\/tool_call>/s);
                  if (toolCallMatch) {
                    const toolCallData = JSON.parse(toolCallMatch[1]);
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "tool_call", tool_call: toolCallData })}\n\n`
                      )
                    );
                    // Remove tool call from visible content
                    const visibleContent = content.replace(/<tool_call>.*?<\/tool_call>/s, "");
                    if (visibleContent.trim()) {
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: "content", content: visibleContent })}\n\n`
                        )
                      );
                    }
                  } else if (content) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "content", content })}\n\n`
                      )
                    );
                  }
                } catch {
                  // Forward raw content if parsing fails
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "content", content: data })}\n\n`)
                  );
                }
              }
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: (err as Error).message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
