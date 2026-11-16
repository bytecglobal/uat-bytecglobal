import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { ROLES, recordAuditLogSync } from "@/lib/auth/session";
import fs from "fs";
import path from "path";

const BACKUPS_DIR = path.join(process.cwd(), "data", "backups");

export async function GET(req) {
  return withAdminAuth(req, "backups", async (r, admin) => {
    if (admin.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Only Super Admins can access backups." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const downloadId = searchParams.get("download");

    if (downloadId) {
      const db = getDb();
      const backup = (db.backups || []).find((b) => b.id === downloadId);
      if (!backup || !fs.existsSync(backup.filePath)) {
        return NextResponse.json({ success: false, error: "Backup file not found" }, { status: 404 });
      }

      const fileContent = fs.readFileSync(backup.filePath, "utf8");
      return new NextResponse(fileContent, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${backup.filename}"`,
        },
      });
    }

    const db = getDb();
    return NextResponse.json({
      success: true,
      backups: db.backups || [],
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "backups", async () => {
    if (admin.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Only Super Admins can manage backups." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, backupId } = body;

    const db = getDb();

    // 1. Restore Backup
    if (action === "restore" && backupId) {
      const backup = (db.backups || []).find((b) => b.id === backupId);
      if (!backup || !fs.existsSync(backup.filePath)) {
        return NextResponse.json({ success: false, error: "Backup file not found" }, { status: 404 });
      }

      try {
        const raw = fs.readFileSync(backup.filePath, "utf8");
        const restoredDb = JSON.parse(raw);
        await saveDb(restoredDb);

        recordAuditLogSync({
          adminId: admin.id,
          adminEmail: admin.email,
          action: "RESTORE_DATABASE_BACKUP",
          module: "BACKUPS",
          recordId: backupId,
          ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
          details: `Restored database from snapshot ${backup.filename}.`,
          result: "success",
        });

        return NextResponse.json({ success: true, message: "Database restored successfully from backup." });
      } catch (err) {
        return NextResponse.json({ success: false, error: `Restore error: ${err.message}` }, { status: 500 });
      }
    }

    // 2. Create New Backup
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    const filename = `bytec_backup_${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    const snapshot = JSON.stringify(db, null, 2);
    fs.writeFileSync(filePath, snapshot, "utf8");
    const stats = fs.statSync(filePath);

    const newBackup = {
      id: `bak_${Date.now()}`,
      filename,
      filePath,
      size: stats.size,
      timestamp: now.toISOString(),
      createdByName: admin.name || admin.email,
      recordCounts: {
        contacts: (db.contacts || []).length,
        leads: (db.leads || []).length,
        clients: (db.clients || []).length,
        projects: (db.projects || []).length,
        visitors: (db.visitors || []).length,
      },
      status: "completed",
    };

    if (!db.backups) db.backups = [];
    db.backups.unshift(newBackup);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CREATE_DATABASE_BACKUP",
      module: "BACKUPS",
      recordId: newBackup.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Created snapshot backup ${filename} (${stats.size} bytes).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, backup: newBackup });
  });
}
