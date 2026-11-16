import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required." }, { status: 400 });
    }

    const db = getDb();
    const user = (db.users || []).find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());

    // Even if user not found, don't leak account existence to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If that email is registered, a password reset link has been dispatched.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpires = expiresAt;

    recordAuditLogSync({
      adminId: user.id,
      adminEmail: user.email,
      action: "PASSWORD_RESET_REQUESTED",
      module: "AUTH",
      recordId: user.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: "Password reset token generated.",
      result: "success",
    });

    await saveDb(db);

    return NextResponse.json({
      success: true,
      message: "If that email is registered, a password reset link has been dispatched.",
      // In dev mode/setup: provide the token for verification
      demoResetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
