import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@/lib/cloudflare";

export async function GET() {
  try {
    const { db } = getCloudflareContext();
    const result = await db.prepare("SELECT * FROM visas ORDER BY id DESC").all();
    return NextResponse.json({ success: true, data: result.results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, flag, price, visaType } = await request.json();
    const { db } = getCloudflareContext();

    const result = await db
      .prepare("INSERT INTO visas (name, flag, price, visaType) VALUES (?, ?, ?, ?)")
      .bind(name, flag, price, visaType)
      .run();

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    const { db } = getCloudflareContext();

    await db.prepare("DELETE FROM visas WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}