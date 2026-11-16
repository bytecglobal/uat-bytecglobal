import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "whatsapp", async () => {
    const db = getDb();
    const clicks = (db.analytics_events || []).filter((e) => e.eventName === "whatsapp_click").length;

    return NextResponse.json({
      success: true,
      settings: {
        ...(db.whatsapp_settings || {}),
        clickCount: clicks,
      },
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "whatsapp", async () => {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber, defaultMessage, enabled, position } = body;

    const db = getDb();
    const now = new Date().toISOString();

    db.whatsapp_settings = {
      ...db.whatsapp_settings,
      phoneNumber: phoneNumber !== undefined ? String(phoneNumber).trim() : db.whatsapp_settings.phoneNumber,
      defaultMessage: defaultMessage !== undefined ? defaultMessage : db.whatsapp_settings.defaultMessage,
      enabled: enabled !== undefined ? Boolean(enabled) : db.whatsapp_settings.enabled,
      position: position || db.whatsapp_settings.position || "bottom-right",
      updatedAt: now,
    };

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_WHATSAPP_SETTINGS",
      module: "WHATSAPP",
      recordId: "settings",
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated WhatsApp configuration (Number: ${db.whatsapp_settings.phoneNumber}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, settings: db.whatsapp_settings });
  });
}
