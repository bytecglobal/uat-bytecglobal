import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { NotificationRepository } from "@/lib/repositories/notification.repository";

export async function GET(req) {
  return withAdminAuth(req, "notifications", async () => {
    try {
      const result = await NotificationRepository.list({ limit: 100 });
      return NextResponse.json({
        success: true,
        notifications: result.notifications,
        unreadCount: result.unreadCount,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch notifications" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "notifications", async (request) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { id, markAllRead } = body;

      if (markAllRead) {
        await NotificationRepository.markAllAsRead();
      } else if (id) {
        await NotificationRepository.markAsRead(id);
      }

      return NextResponse.json({ success: true, message: "Notifications updated." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to update notifications" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "notifications", async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (id === "all") {
        await NotificationRepository.deleteAll();
      } else if (id) {
        await NotificationRepository.delete(id);
      }

      return NextResponse.json({ success: true, message: "Notification(s) deleted." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to delete notification(s)" },
        { status: 500 }
      );
    }
  });
}
