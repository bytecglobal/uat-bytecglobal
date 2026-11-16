import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getAnalyticsOverview } from "@/lib/analytics";

export async function GET(req) {
  return withAdminAuth(req, "analytics", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const range = searchParams.get("range") || "30d";

      const data = await getAnalyticsOverview(range);

      return NextResponse.json({
        success: true,
        data,
      });
    } catch (err) {
      console.error("Admin analytics API error:", err);
      return NextResponse.json(
        { success: false, error: "Failed to retrieve analytics data." },
        { status: 500 }
      );
    }
  });
}
