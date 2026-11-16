import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { AdminRepository } from "@/lib/repositories/admin.repository";
import { ROLES } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "audit-logs", async (r, admin) => {
    if (admin.role !== ROLES.SUPER_ADMIN && admin.role !== ROLES.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    try {
      const { searchParams } = new URL(req.url);
      const moduleFilter = searchParams.get("module") || "all";
      const search = searchParams.get("search") || "";
      const format = searchParams.get("format");
      const limit = format === "csv" ? 1000 : 150;

      const { logs, total } = await AdminRepository.listAuditLogs({
        page: 1,
        limit,
        module: moduleFilter === "all" ? null : moduleFilter,
        search,
      });

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
        logs,
        totalCount: total,
      });
    } catch (err) {
      console.error("Audit logs API error:", err);
      return NextResponse.json({ success: false, error: "Failed to retrieve audit logs." }, { status: 500 });
    }
  });
}
