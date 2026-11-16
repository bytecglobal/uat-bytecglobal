import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { SettingsRepository } from "@/lib/repositories/settings.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "seo", async () => {
    try {
      const seo = await SettingsRepository.getSeoSettings();
      return NextResponse.json({
        success: true,
        seo,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch SEO settings" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "seo", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { global, pagePath, pageSeo } = body;

      const payload = {};
      if (global) payload.global = global;
      if (pagePath && pageSeo) {
        payload.pages = { [pagePath]: pageSeo };
      }

      const seo = await SettingsRepository.updateSeoSettings(payload);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_SEO",
        module: "SEO",
        recordId: pagePath || "global",
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Updated SEO configuration (${pagePath || "global settings"}).`,
        result: "success",
      });

      return NextResponse.json({
        success: true,
        message: "SEO settings updated successfully.",
        seo,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to update SEO settings" },
        { status: 500 }
      );
    }
  });
}
