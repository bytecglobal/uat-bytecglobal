import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getDb, saveDb } from "@/lib/db";

const JWT_SECRET_STRING = process.env.ADMIN_JWT_SECRET || "bytec_enterprise_super_secure_jwt_secret_token_2026_xyz";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = "bytec_admin_session";
const SESSION_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  MANAGER: "MANAGER",
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "overview",
    "visitors",
    "analytics",
    "contacts",
    "leads",
    "clients",
    "projects",
    "meetings",
    "reviews",
    "emails",
    "automations",
    "templates",
    "notifications",
    "whatsapp",
    "newsletter",
    "cms",
    "seo",
    "media",
  ],
  EDITOR: [
    "overview",
    "cms",
    "seo",
    "media",
    "reviews",
    "notifications",
  ],
  MANAGER: [
    "overview",
    "contacts",
    "leads",
    "clients",
    "meetings",
    "projects",
    "reviews",
    "notifications",
  ],
};

export function canAccessModule(role, moduleName) {
  if (!role) return false;
  if (role === ROLES.SUPER_ADMIN) return true;
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(moduleName);
}

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

    const db = getDb();
    const user = db.users.find((u) => u.id === payload.userId && u.status === "active");
    if (!user) return null;

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
 * Validates login credentials with brute force protection
 */
export async function authenticateAdmin({ email, password, ip = "127.0.0.1" }) {
  const db = getDb();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  const now = new Date();

  if (!user) {
    recordAuditLogSync({
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
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    const maxAttempts = db.system_settings?.security?.maxLoginAttempts || 5;

    if (user.failedAttempts >= maxAttempts) {
      const lockoutMinutes = db.system_settings?.security?.lockoutDurationMinutes || 15;
      user.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60000).toISOString();
      recordAuditLogSync({
        adminId: user.id,
        adminEmail: user.email,
        action: "ACCOUNT_LOCKOUT",
        module: "AUTH",
        recordId: user.id,
        ip,
        details: `Account locked for ${lockoutMinutes} mins after ${user.failedAttempts} failed attempts.`,
        result: "failure",
      });
    } else {
      recordAuditLogSync({
        adminId: user.id,
        adminEmail: user.email,
        action: "LOGIN_FAILED",
        module: "AUTH",
        recordId: user.id,
        ip,
        details: `Password mismatch (Attempt ${user.failedAttempts}/${maxAttempts}).`,
        result: "failure",
      });
    }

    await saveDb(db);
    return { success: false, error: "Invalid email or password." };
  }

  // Reset failed attempts & update last login
  user.failedAttempts = 0;
  user.lockoutUntil = null;
  user.lastLogin = now.toISOString();

  recordAuditLogSync({
    adminId: user.id,
    adminEmail: user.email,
    action: "LOGIN_SUCCESS",
    module: "AUTH",
    recordId: user.id,
    ip,
    details: "Successful admin authentication.",
    result: "success",
  });

  await saveDb(db);

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
 * Record an audit log entry synchronously into the active db
 */
export function recordAuditLogSync({ adminId, adminEmail, action, module, recordId, ip, details, result }) {
  try {
    const db = getDb();
    const entry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      adminId: adminId || "system",
      adminEmail: adminEmail || "system",
      action,
      module,
      recordId: recordId || "",
      ip: ip || "127.0.0.1",
      details: details || "",
      result: result || "success",
      timestamp: new Date().toISOString(),
    };

    if (!db.audit_logs) db.audit_logs = [];
    db.audit_logs.unshift(entry);
    // Keep last 1000 logs to maintain fast performance
    if (db.audit_logs.length > 1000) {
      db.audit_logs = db.audit_logs.slice(0, 1000);
    }
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
