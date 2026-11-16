import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { ROLES } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "audit-logs", async (r, admin) => {
    if (admin.role !== ROLES.SUPER_ADMIN && admin.role !== ROLES.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const moduleFilter = searchParams.get("module") || "all";
    const resultFilter = searchParams.get("result") || "all";
    const search = (searchParams.get("search") || "").toLowerCase();
    const format = searchParams.get("format");

    const db = getDb();
    let logs = [...(db.audit_logs || [])];

    if (search) {
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(search) ||
          l.adminEmail.toLowerCase().includes(search) ||
          l.details.toLowerCase().includes(search) ||
          l.ip.includes(search)
      );
    }

    if (moduleFilter !== "all") {
      logs = logs.filter((l) => l.module === moduleFilter);
    }

    if (resultFilter !== "all") {
      logs = logs.filter((l) => l.result === resultFilter);
    }

    if (format === "csv") {
      const headers = "Timestamp,Admin Email,Action,Module,Record ID,IP,Result,Details\n";
      const rows = logs
        .map(
          (l) =>
            `"${l.timestamp}","${l.adminEmail}","${l.action}","${l.module}","${l.recordId}","${l.ip}","${l.result}","${(l.details || "").replace(/"/g, '""')}"`
        )
        .join("\n");

      return new NextResponse(headers + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="bytec_audit_logs.csv"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      logs: logs.slice(0, 150),
      totalCount: logs.length,
    });
  });
}
