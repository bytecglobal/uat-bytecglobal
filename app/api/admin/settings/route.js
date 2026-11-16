import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { SettingsRepository } from "@/lib/repositories/settings.repository";
import { ROLES, recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "settings", async () => {
    try {
      const settings = await SettingsRepository.getSystemSettings();
      return NextResponse.json({
        success: true,
        settings,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch settings" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "settings", async (request, admin) => {
    try {
      if (admin.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json(
          { success: false, error: "Only Super Admins can update system settings." },
          { status: 403 }
        );
      }

      const body = await request.json().catch(() => ({}));
      const { general, security } = body;

      const updated = await SettingsRepository.updateSystemSettings({ general, security });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_SYSTEM_SETTINGS",
        module: "SETTINGS",
        recordId: "system",
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: "Updated global system settings in PostgreSQL.",
        result: "success",
      });

      return NextResponse.json({ success: true, settings: updated });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to update settings" },
        { status: 500 }
      );
    }
  });
}
