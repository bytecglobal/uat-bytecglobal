import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { NotificationRepository } from "@/lib/repositories/notification.repository";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { unreadCount } = await NotificationRepository.list({ unreadOnly: true, limit: 1 });

    return NextResponse.json({
      authenticated: true,
      user: admin,
      unreadNotifications: unreadCount,
    });
  } catch (err) {
    console.error("Auth me check error:", err);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
