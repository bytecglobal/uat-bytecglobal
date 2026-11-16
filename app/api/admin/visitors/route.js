import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";

export async function GET(req) {
  return withAdminAuth(req, "visitors", async () => {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase();
    const device = searchParams.get("device") || "all";
    const source = searchParams.get("source") || "all";
    const format = searchParams.get("format");

    const db = getDb();
    let visitors = [...(db.visitors || [])];

    if (search) {
      visitors = visitors.filter(
        (v) =>
          v.visitorId.toLowerCase().includes(search) ||
          (v.landingPage || "").toLowerCase().includes(search) ||
          (v.browser || "").toLowerCase().includes(search) ||
          (v.trafficSource || "").toLowerCase().includes(search)
      );
    }

    if (device !== "all") {
      visitors = visitors.filter((v) => v.deviceType === device);
    }

    if (source !== "all") {
      visitors = visitors.filter((v) => v.trafficSource === source);
    }

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
      totalCount: visitors.length,
    });
  });
}
