import { NextResponse } from "next/server";
import { getCurrentAdmin, canAccessModule, recordAuditLogSync } from "@/lib/auth/session";

/**
 * Route protection wrapper for Next.js API handlers
 */
export async function withAdminAuth(req, moduleName, handler) {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Please log in to access admin resources." },
      { status: 401 }
    );
  }

  if (moduleName && !canAccessModule(currentAdmin.role, moduleName)) {
    recordAuditLogSync({
      adminId: currentAdmin.id,
      adminEmail: currentAdmin.email,
      action: "ACCESS_DENIED",
      module: moduleName.toUpperCase(),
      recordId: "",
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Forbidden access attempt to ${moduleName} with role ${currentAdmin.role}.`,
      result: "failure",
    });

    return NextResponse.json(
      { success: false, error: "Forbidden. Your role does not have permission for this module." },
      { status: 403 }
    );
  }

  return handler(req, currentAdmin);
}
