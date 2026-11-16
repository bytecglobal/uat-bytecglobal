import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { SettingsRepository } from "@/lib/repositories/settings.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "newsletter", async () => {
    try {
      const result = await SettingsRepository.listNewsletterSubscribers({ limit: 200 });
      return NextResponse.json({
        success: true,
        subscribers: result.subscribers,
        total: result.total,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch newsletter subscribers" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "newsletter", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { email } = body;

      if (!email) {
        return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
      }

      const subscriber = await SettingsRepository.addNewsletterSubscriber(email);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "ADD_SUBSCRIBER",
        module: "NEWSLETTER",
        recordId: subscriber.id || email,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Added subscriber ${email}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, subscriber });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to add subscriber" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "newsletter", async (request, admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Subscriber ID required" }, { status: 400 });
      }

      await SettingsRepository.deleteNewsletterSubscriber(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "REMOVE_SUBSCRIBER",
        module: "NEWSLETTER",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Removed subscriber ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Subscriber removed." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to delete subscriber" },
        { status: 500 }
      );
    }
  });
}
