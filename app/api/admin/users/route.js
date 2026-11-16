import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { ROLES, recordAuditLogSync } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

export async function GET(req) {
  return withAdminAuth(req, "users", async (r, admin) => {
    // Only Super Admin or Admin can list users
    if (admin.role !== ROLES.SUPER_ADMIN && admin.role !== ROLES.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const db = getDb();
    const safeUsers = (db.users || []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      failedAttempts: u.failedAttempts,
      isLocked: Boolean(u.lockoutUntil && new Date(u.lockoutUntil) > new Date()),
    }));

    return NextResponse.json({
      success: true,
      users: safeUsers,
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "users", async () => {
    // Only SUPER_ADMIN can create new admin accounts
    if (admin.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Only Super Admins can create admin accounts." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, error: "Name, email, password, and role are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const db = getDb();
    const existing = (db.users || []).find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      return NextResponse.json({ success: false, error: "A user with this email already exists." }, { status: 409 });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role in ROLES ? role : ROLES.ADMIN,
      status: "active",
      createdAt: now,
      lastLogin: null,
      failedAttempts: 0,
      lockoutUntil: null,
    };

    if (!db.users) db.users = [];
    db.users.push(newUser);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CREATE_ADMIN_USER",
      module: "USERS",
      recordId: newUser.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Created new admin account for ${email} with role ${newUser.role}.`,
      result: "success",
    });

    await saveDb(db);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "users", async () => {
    if (admin.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Only Super Admins can update admin accounts." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, name, role, status, resetLockout, newPassword } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const db = getDb();
    const targetUser = (db.users || []).find((u) => u.id === id);

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (name) targetUser.name = name;
    if (role && role in ROLES) targetUser.role = role;
    if (status && ["active", "inactive"].includes(status)) targetUser.status = status;

    if (resetLockout) {
      targetUser.failedAttempts = 0;
      targetUser.lockoutUntil = null;
    }

    if (newPassword && newPassword.length >= 8) {
      const salt = bcrypt.genSaltSync(10);
      targetUser.passwordHash = bcrypt.hashSync(newPassword, salt);
    }

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_ADMIN_USER",
      module: "USERS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated user ${targetUser.email} (Role: ${targetUser.role}, Status: ${targetUser.status}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "User updated successfully." });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "users", async () => {
    if (admin.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ success: false, error: "Only Super Admins can delete users." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    if (id === admin.id) {
      return NextResponse.json({ success: false, error: "You cannot delete your own Super Admin account." }, { status: 400 });
    }

    const db = getDb();
    db.users = (db.users || []).filter((u) => u.id !== id);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELETE_ADMIN_USER",
      module: "USERS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Deleted user ${id}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "User deleted." });
  });
}
