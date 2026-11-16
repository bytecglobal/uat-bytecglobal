import { NextResponse } from "next/server";
import { getCurrentAdmin, recordAuditLogSync } from "@/lib/auth/session";

export async function POST(req) {
  try {
    const admin = await getCurrentAdmin();
    if (admin) {
      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "LOGOUT",
        module: "AUTH",
        recordId: admin.id,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: "Admin logged out successfully.",
        result: "success",
      });
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully." });
    response.cookies.delete("bytec_admin_session");
    return response;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ success: false, error: "Logout error" }, { status: 500 });
  }
}
