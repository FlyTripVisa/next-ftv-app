import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@/lib/cloudflare";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, messages = [] } = body;

    const { ai } = getCloudflareContext();

    const conversation = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    if (!messages.some((m: any) => m.role === "user" && m.content === prompt)) {
      conversation.push({ role: "user", content: prompt });
    }

    const response = await ai.run("@cf/meta/llama-3-8b-instruct", {
      messages: conversation,
      stream: false,
      max_tokens: 1024,
    });

    return NextResponse.json({
      response: response.response,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: error.message },
      { status: 500 }
    );
  }
}