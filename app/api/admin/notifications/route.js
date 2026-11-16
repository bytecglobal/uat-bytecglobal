import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";

export async function GET(req) {
  return withAdminAuth(req, "notifications", async () => {
    const db = getDb();
    const notifications = db.notifications || [];
    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "notifications", async () => {
    const body = await req.json().catch(() => ({}));
    const { id, markAllRead } = body;

    const db = getDb();

    if (markAllRead) {
      (db.notifications || []).forEach((n) => {
        n.read = true;
      });
    } else if (id) {
      const notif = (db.notifications || []).find((n) => n.id === id);
      if (notif) notif.read = true;
    }

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Notifications updated." });
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "notifications", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const db = getDb();

    if (id === "all") {
      db.notifications = [];
    } else if (id) {
      db.notifications = (db.notifications || []).filter((n) => n.id !== id);
    }

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Notification(s) deleted." });
  });
}
