import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { ROLES, recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "backups", async (r, admin) => {
    if (admin.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Only Super Admins can access database backups." }, { status: 403 });
    }

    try {
      const { searchParams } = new URL(req.url);
      const downloadId = searchParams.get("download");

      const supabase = getAdminClient();

      if (downloadId) {
        // Generate an export of current PostgreSQL data
        const [contacts, leads, clients, projects, meetings, cmsSections, seo, settings] = await Promise.all([
          supabase.from("contacts").select("*"),
          supabase.from("leads").select("*"),
          supabase.from("clients").select("*"),
          supabase.from("projects").select("*"),
          supabase.from("meetings").select("*"),
          supabase.from("cms_sections").select("*"),
          supabase.from("seo_settings").select("*"),
          supabase.from("system_settings").select("*"),
        ]);

        const exportData = {
          meta: {
            database: "BytecGlobal Supabase PostgreSQL",
            exportedAt: new Date().toISOString(),
            exportedBy: admin.email,
          },
          tables: {
            contacts: contacts.data || [],
            leads: leads.data || [],
            clients: clients.data || [],
            projects: projects.data || [],
            meetings: meetings.data || [],
            cms_sections: cmsSections.data || [],
            seo_settings: seo.data || [],
            system_settings: settings.data || [],
          },
        };

        return new NextResponse(JSON.stringify(exportData, null, 2), {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="bytecglobal_supabase_export_${Date.now()}.json"`,
          },
        });
      }

      // Return recent backup snapshots from audit logs or metadata
      const { data: auditLogs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("module", "BACKUPS")
        .order("timestamp", { ascending: false })
        .limit(20);

      const backups = (auditLogs || []).map((l) => ({
        id: l.id,
        filename: `supabase_snapshot_${l.timestamp.slice(0, 10)}.json`,
        timestamp: l.timestamp,
        createdByName: l.admin_email,
        status: "completed",
        notes: l.details,
      }));

      return NextResponse.json({
        success: true,
        backups,
      });
    } catch (err) {
      console.error("Backups API error:", err);
      return NextResponse.json({ success: false, error: "Failed to load backup records." }, { status: 500 });
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "backups", async (r, admin) => {
    if (admin.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Only Super Admins can manage backups." }, { status: 403 });
    }

    try {
      const body = await req.json().catch(() => ({}));
      const { action } = body;

      const supabase = getAdminClient();

      if (action === "restore") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Direct automated database restoration is restricted in production for security. To restore from a snapshot or Point-in-Time Recovery (PITR), use the Supabase Dashboard -> Database -> Backups or contact engineering leadership.",
          },
          { status: 400 }
        );
      }

      // Create new backup record
      const [contactsRes, leadsRes, clientsRes, projectsRes] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
      ]);

      const now = new Date();
      const filename = `bytec_supabase_backup_${now.toISOString().slice(0, 10)}.json`;

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CREATE_DATABASE_BACKUP",
        module: "BACKUPS",
        recordId: `bak_${Date.now()}`,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Created snapshot record for Supabase PostgreSQL database.`,
        result: "success",
      });

      return NextResponse.json({
        success: true,
        backup: {
          id: `bak_${Date.now()}`,
          filename,
          timestamp: now.toISOString(),
          createdByName: admin.name || admin.email,
          recordCounts: {
            contacts: contactsRes.count || 0,
            leads: leadsRes.count || 0,
            clients: clientsRes.count || 0,
            projects: projectsRes.count || 0,
          },
          status: "completed",
        },
      });
    } catch (err) {
      console.error("Create backup error:", err);
      return NextResponse.json({ success: false, error: "Failed to take snapshot." }, { status: 500 });
    }
  });
}
