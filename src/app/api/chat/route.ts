import { NextRequest } from "next/server";
import { getAI } from "@/lib/cloudflare";

const SYSTEM_PROMPT = `You are the FlyTripVisa AI Agent... (আপনার প্রম্পট ঠিক আছে)`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const ai = await getAI();

    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Cloudflare AI response stream
    const stream = await ai.run("@cf/meta/llama-3.1-70b-instruct", {
      messages: formattedMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // stream সরাসরি একটি AsyncIterable হিসেবে কাজ করে
          for await (const chunk of stream as any) {
            const content = chunk.response || "";
            
            // টুল কল ডিটেকশন
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
          controller.error(err);
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
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
}
