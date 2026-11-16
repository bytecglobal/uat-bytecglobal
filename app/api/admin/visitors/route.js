import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { AnalyticsRepository } from "@/lib/repositories/analytics.repository";

export async function GET(req) {
  return withAdminAuth(req, "visitors", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search") || "";
      const device = searchParams.get("device") || "all";
      const source = searchParams.get("source") || "all";
      const format = searchParams.get("format");

      const result = await AnalyticsRepository.listVisitors({
        search,
        device,
        source,
        limit: 200,
      });

      const visitors = result.visitors || [];

      // CSV Export option
      if (format === "csv") {
        const headers = "Visitor ID,Total Visits,First Visit,Last Visit,Landing Page,Device,Browser,OS,Traffic Source\n";
        const rows = visitors
          .map(
            (v) =>
              `"${v.visitorId}",${v.totalVisits},"${v.firstVisit}","${v.lastVisit}","${v.landingPage}","${v.deviceType}","${v.browser}","${v.os}","${v.trafficSource}"`
          )
          .join("\n");

        return new NextResponse(headers + rows, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": 'attachment; filename="bytec_visitors.csv"',
          },
        });
      }

      return NextResponse.json({
        success: true,
        visitors,
        totalCount: result.total,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch visitors" },
        { status: 500 }
      );
    }
  });
}
