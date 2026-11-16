import { NextResponse } from "next/server";
import { AdminRepository } from "@/lib/repositories/admin.repository";
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

    const tokenRecord = await AdminRepository.findPasswordResetToken(token);
    if (!tokenRecord || !tokenRecord.user_id) {
      return NextResponse.json({ success: false, error: "Invalid or expired reset token." }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    await AdminRepository.updateUser(tokenRecord.user_id, {
      passwordHash,
      failedAttempts: 0,
      lockoutUntil: null,
    });

    await AdminRepository.markPasswordResetTokenUsed(tokenRecord.id);

    const user = tokenRecord.admin_users || (await AdminRepository.findById(tokenRecord.user_id));

    recordAuditLogSync({
      adminId: tokenRecord.user_id,
      adminEmail: user?.email || "unknown",
      action: "PASSWORD_RESET_COMPLETED",
      module: "AUTH",
      recordId: tokenRecord.user_id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: "Password successfully changed via reset token.",
      result: "success",
    });

    return NextResponse.json({ success: true, message: "Password reset successful. You may now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
