import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: "Token and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const db = getDb();
    const now = new Date();
    const user = (db.users || []).find((u) => u.resetToken === token);

    if (!user || !user.resetTokenExpires || new Date(user.resetTokenExpires) < now) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset token." }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    user.resetToken = null;
    user.resetTokenExpires = null;
    user.failedAttempts = 0;
    user.lockoutUntil = null;

    recordAuditLogSync({
      adminId: user.id,
      adminEmail: user.email,
      action: "PASSWORD_RESET_COMPLETED",
      module: "AUTH",
      recordId: user.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: "Password successfully changed via reset token.",
      result: "success",
    });

    await saveDb(db);

    return NextResponse.json({ success: true, message: "Password reset successful. You may now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
