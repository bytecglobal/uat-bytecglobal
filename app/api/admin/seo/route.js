import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "seo", async () => {
    const db = getDb();
    return NextResponse.json({
      success: true,
      seo: db.seo_settings || {},
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "seo", async () => {
    const body = await req.json().catch(() => ({}));
    const { global, pagePath, pageSeo } = body;

    const db = getDb();
    if (!db.seo_settings) db.seo_settings = {};

    if (global) {
      db.seo_settings.global = {
        ...db.seo_settings.global,
        ...global,
      };
    }

    if (pagePath && pageSeo) {
      if (!db.seo_settings.pages) db.seo_settings.pages = {};
      db.seo_settings.pages[pagePath] = {
        ...db.seo_settings.pages[pagePath],
        ...pageSeo,
      };
    }

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_SEO",
      module: "SEO",
      recordId: pagePath || "global",
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated SEO configuration (${pagePath || "global settings"}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "SEO settings updated successfully.", seo: db.seo_settings });
  });
}
