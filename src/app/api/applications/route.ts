import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@/lib/cloudflare";

export async function GET() {
  try {
    const { db } = getCloudflareContext();
    const result = await db.prepare("SELECT * FROM applications ORDER BY id DESC").all();
    return NextResponse.json({ success: true, data: result.results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, country, status = "Pending" } = await request.json();
    const { db } = getCloudflareContext();

    const result = await db
      .prepare("INSERT INTO applications (email, country, status, date) VALUES (?, ?, ?, datetime('now'))")
      .bind(email, country, status)
      .run();

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}