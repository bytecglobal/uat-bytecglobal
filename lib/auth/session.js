import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { AdminRepository } from "@/lib/repositories/admin.repository";
import { ROLES, ROLE_PERMISSIONS, canAccessModule } from "@/lib/auth/permissions";
import { getAdminJwtSecret } from "@/lib/env";

export { ROLES, ROLE_PERMISSIONS, canAccessModule };

const JWT_SECRET = new TextEncoder().encode(getAdminJwtSecret());
export const COOKIE_NAME = "bytec_admin_session";
export const SESSION_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Creates a signed JWT for the admin session
 */
export async function createSessionToken(user) {
  return await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_SECONDS}s`)
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT token
 */
export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side session extractor from Next.js cookies
 */
export async function getCurrentAdmin() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.userId) return null;

    const user = await AdminRepository.findById(payload.userId);
    if (!user || user.status !== "active") return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    };
  } catch (err) {
    console.error("Error retrieving admin session:", err);
    return null;
  }
}

/**
 * Validates login credentials with brute force protection and account lockout
 */
export async function authenticateAdmin({ email, password, ip = "127.0.0.1" }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await AdminRepository.findByEmail(normalizedEmail);
  const now = new Date();

  if (!user) {
    await AdminRepository.recordAuditLog({
      adminId: "unauthenticated",
      adminEmail: normalizedEmail,
      action: "LOGIN_FAILED",
      module: "AUTH",
      recordId: "auth",
      ip,
      details: "Invalid email attempt.",
      result: "failure",
    });
    return { success: false, error: "Invalid email or password." };
  }

  // Check lockout
  if (user.lockoutUntil && new Date(user.lockoutUntil) > now) {
    const remainingMinutes = Math.ceil((new Date(user.lockoutUntil) - now) / 60000);
    return {
      success: false,
      error: `Account is temporarily locked due to excessive failed attempts. Try again in ${remainingMinutes} minute(s).`,
    };
  }

  if (user.status !== "active") {
    return { success: false, error: "This admin account has been deactivated." };
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);

  if (!isPasswordValid) {
    await AdminRepository.recordFailedAttempt(user.id, user.failedAttempts, 5, 15);
    await AdminRepository.recordAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: "LOGIN_FAILED",
      module: "AUTH",
      recordId: user.id,
      ip,
      details: `Password mismatch for ${user.email}.`,
      result: "failure",
    });
    return { success: false, error: "Invalid email or password." };
  }

  // Reset failed attempts & update last login
  await AdminRepository.updateLastLogin(user.id);

  await AdminRepository.recordAuditLog({
    adminId: user.id,
    adminEmail: user.email,
    action: "LOGIN_SUCCESS",
    module: "AUTH",
    recordId: user.id,
    ip,
    details: "Successful admin authentication.",
    result: "success",
  });

  const token = await createSessionToken(user);
  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Record an audit log entry
 */
export function recordAuditLogSync({ adminId, adminEmail, action, module, recordId, ip, details, result }) {
  // Fire and forget audit log to PostgreSQL
  AdminRepository.recordAuditLog({
    adminId,
    adminEmail,
    action,
    module,
    recordId,
    ip,
    details,
    result,
  }).catch((err) => console.error("Async audit log error:", err));
}
