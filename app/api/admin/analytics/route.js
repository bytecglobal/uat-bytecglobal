import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getAnalyticsOverview } from "@/lib/analytics";

export async function GET(req) {
  return withAdminAuth(req, "analytics", async () => {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    const data = getAnalyticsOverview(range);

    return NextResponse.json({
      success: true,
      data,
    });
  });
}
