import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const db = getDb();
    const unreadCount = (db.notifications || []).filter((n) => !n.read).length;

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
