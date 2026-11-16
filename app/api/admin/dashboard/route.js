import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getAnalyticsOverview } from "@/lib/analytics";
import { getDb } from "@/lib/db";

export async function GET(req) {
  return withAdminAuth(req, "overview", async () => {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";

    const overview = getAnalyticsOverview(range);
    const db = getDb();

    return NextResponse.json({
      success: true,
      data: {
        ...overview,
        recentVisitors: (db.visitors || []).slice(0, 5),
        recentInquiries: (db.contacts || []).slice(0, 5),
        recentLeads: (db.leads || []).slice(0, 5),
        upcomingMeetings: (db.meetings || []).filter((m) => m.status === "confirmed").slice(0, 5),
        recentProjects: (db.projects || []).slice(0, 4),
        recentActivities: (db.audit_logs || []).slice(0, 8),
        systemNotifications: (db.notifications || []).slice(0, 5),
      },
    });
  });
}
