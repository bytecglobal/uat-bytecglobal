import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getAnalyticsOverview } from "@/lib/analytics";
import { AnalyticsRepository } from "@/lib/repositories/analytics.repository";
import { ContactRepository } from "@/lib/repositories/contact.repository";
import { LeadRepository } from "@/lib/repositories/lead.repository";
import { MeetingRepository } from "@/lib/repositories/meeting.repository";
import { ProjectRepository } from "@/lib/repositories/project.repository";
import { AdminRepository } from "@/lib/repositories/admin.repository";
import { NotificationRepository } from "@/lib/repositories/notification.repository";

export async function GET(req) {
  return withAdminAuth(req, "overview", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const range = searchParams.get("range") || "30d";

      const [
        overview,
        { visitors: recentVisitors },
        { contacts: recentInquiries },
        { leads: recentLeads },
        { meetings: upcomingMeetings },
        { projects: recentProjects },
        { logs: recentActivities },
        { notifications: systemNotifications },
      ] = await Promise.all([
        getAnalyticsOverview(range),
        AnalyticsRepository.listVisitors({ limit: 5 }),
        ContactRepository.list({ limit: 5 }),
        LeadRepository.list({ limit: 5 }),
        MeetingRepository.list({ status: "confirmed", limit: 5 }),
        ProjectRepository.list({ limit: 4 }),
        AdminRepository.listAuditLogs({ limit: 8 }),
        NotificationRepository.list({ limit: 5 }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          ...overview,
          recentVisitors,
          recentInquiries,
          recentLeads,
          upcomingMeetings,
          recentProjects,
          recentActivities,
          systemNotifications,
        },
      });
    } catch (err) {
      console.error("Dashboard overview error:", err);
      return NextResponse.json({ success: false, error: "Failed to load dashboard data." }, { status: 500 });
    }
  });
}
