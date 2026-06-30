import { NextResponse } from "next/server";
import { getCloudflareContext } from "@/lib/cloudflare";

export async function GET() {
  try {
    const { db } = getCloudflareContext();

    const appsResult = await db.prepare("SELECT COUNT(*) as count FROM applications").first();
    const visasResult = await db.prepare("SELECT COUNT(*) as count FROM visas").first();
    const usersResult = await db.prepare("SELECT COUNT(DISTINCT email) as count FROM applications").first();

    return NextResponse.json({
      success: true,
      data: {
        totalApps: appsResult?.count || 0,
        totalVisas: visasResult?.count || 0,
        totalUsers: usersResult?.count || 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}