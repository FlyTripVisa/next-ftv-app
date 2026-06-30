import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@/lib/cloudflare";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();
    const { db } = getCloudflareContext();
    const { id } = await params;

    await db
      .prepare("UPDATE applications SET status = ? WHERE id = ?")
      .bind(status, id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}