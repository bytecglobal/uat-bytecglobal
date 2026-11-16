import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { ROLES, recordAuditLogSync } from "@/lib/auth/session";
import { getResendApiKey } from "@/lib/env";

export async function GET(req) {
  return withAdminAuth(req, "settings", async () => {
    const db = getDb();
    const resendKey = getResendApiKey();
    const hasResend = Boolean(resendKey && resendKey !== "re_your_api_key_here");
    const hasWhatsApp = Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || db.whatsapp_settings?.phoneNumber);

    const safeSettings = {
      ...db.system_settings,
      integrations: {
        resend: {
          configured: hasResend,
          status: hasResend ? "Connected & Active" : "Not Configured (Requires RESEND_API_KEY in .env)",
        },
        whatsapp: {
          configured: hasWhatsApp,
          status: hasWhatsApp ? "Connected & Active" : "Not Configured",
        },
        calendly: {
          configured: true,
          status: "Connected (Default Meeting Link)",
        },
      },
    };

    return NextResponse.json({
      success: true,
      settings: safeSettings,
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "settings", async () => {
    if (admin.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Only Super Admins can update system settings." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { general, security } = body;

    const db = getDb();
    if (!db.system_settings) db.system_settings = {};

    if (general) {
      db.system_settings.general = {
        ...db.system_settings.general,
        ...general,
      };
    }

    if (security) {
      db.system_settings.security = {
        ...db.system_settings.security,
        ...security,
      };
    }

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_SYSTEM_SETTINGS",
      module: "SETTINGS",
      recordId: "system",
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: "Updated global system settings.",
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, settings: db.system_settings });
  });
}
