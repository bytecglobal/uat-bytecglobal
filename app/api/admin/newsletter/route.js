import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "newsletter", async () => {
    const db = getDb();
    return NextResponse.json({
      success: true,
      subscribers: db.newsletter || [],
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "newsletter", async () => {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const db = getDb();
    const existing = (db.newsletter || []).find((s) => s.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      existing.status = "subscribed";
      await saveDb(db);
      return NextResponse.json({ success: true, message: "Subscription renewed." });
    }

    const newSub = {
      id: `sub_${Date.now()}`,
      email,
      status: "subscribed",
      campaignsReceived: 0,
      subscribedAt: new Date().toISOString(),
    };

    if (!db.newsletter) db.newsletter = [];
    db.newsletter.unshift(newSub);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "ADD_SUBSCRIBER",
      module: "NEWSLETTER",
      recordId: newSub.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Added subscriber ${email}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, subscriber: newSub });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "newsletter", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Subscriber ID required" }, { status: 400 });
    }

    const db = getDb();
    db.newsletter = (db.newsletter || []).filter((s) => s.id !== id);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "REMOVE_SUBSCRIBER",
      module: "NEWSLETTER",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Removed subscriber ${id}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Subscriber removed." });
  });
}
