import { NextResponse } from "next/server";
import { getCurrentAdmin, recordAuditLogSync } from "@/lib/auth/session";
import { AdminRepository } from "@/lib/repositories/admin.repository";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "Current and new passwords are required." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "New password must be at least 8 characters long." }, { status: 400 });
    }

    const user = await AdminRepository.findById(admin.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
      return NextResponse.json({ success: false, error: "Incorrect current password." }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    await AdminRepository.updateUser(user.id, { passwordHash });

    recordAuditLogSync({
      adminId: user.id,
      adminEmail: user.email,
      action: "PASSWORD_CHANGED",
      module: "AUTH",
      recordId: user.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: "Password changed by authenticated user.",
      result: "success",
    });

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
