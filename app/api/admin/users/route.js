import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { AdminRepository } from "@/lib/repositories/admin.repository";
import { ROLES, recordAuditLogSync } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

export async function GET(req) {
  return withAdminAuth(req, "users", async (request, admin) => {
    try {
      // Only Super Admin or Admin can list users
      if (admin.role !== ROLES.SUPER_ADMIN && admin.role !== ROLES.ADMIN) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }

      const { searchParams } = new URL(request.url);
      const search = searchParams.get("search") || "";
      const role = searchParams.get("role") || undefined;

      const result = await AdminRepository.listUsers({
        search,
        role: role && role !== "all" ? role : undefined,
        limit: 100,
      });

      return NextResponse.json({
        success: true,
        users: result.users,
        total: result.total,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to list users" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "users", async (request, admin) => {
    try {
      // Only SUPER_ADMIN can create new admin accounts
      if (admin.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json(
          { success: false, error: "Only Super Admins can create admin accounts." },
          { status: 403 }
        );
      }

      const body = await request.json().catch(() => ({}));
      const { name, email, password, role } = body;

      if (!name || !email || !password || !role) {
        return NextResponse.json(
          { success: false, error: "Name, email, password, and role are required." },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      const existing = await AdminRepository.findByEmail(email);
      if (existing) {
        return NextResponse.json(
          { success: false, error: "A user with this email already exists." },
          { status: 409 }
        );
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const newUser = await AdminRepository.createUser({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role in ROLES ? role : ROLES.ADMIN,
        status: "active",
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CREATE_ADMIN_USER",
        module: "USERS",
        recordId: newUser.id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Created new admin account for ${email} with role ${newUser.role}.`,
        result: "success",
      });

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
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to create user" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "users", async (request, admin) => {
    try {
      if (admin.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json(
          { success: false, error: "Only Super Admins can update admin accounts." },
          { status: 403 }
        );
      }

      const body = await request.json().catch(() => ({}));
      const { id, name, role, status, resetLockout, newPassword } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
      }

      const targetUser = await AdminRepository.findById(id);
      if (!targetUser) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      const updates = {};
      if (name) updates.name = name;
      if (role && role in ROLES) updates.role = role;
      if (status && ["active", "inactive"].includes(status)) updates.status = status;

      if (resetLockout) {
        updates.failedAttempts = 0;
        updates.lockoutUntil = null;
      }

      if (newPassword && newPassword.length >= 8) {
        const salt = bcrypt.genSaltSync(10);
        updates.passwordHash = bcrypt.hashSync(newPassword, salt);
      }

      const updated = await AdminRepository.updateUser(id, updates);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_ADMIN_USER",
        module: "USERS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Updated user ${targetUser.email} (Role: ${updated.role}, Status: ${updated.status}).`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "User updated successfully." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to update user" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "users", async (request, admin) => {
    try {
      if (admin.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json(
          { success: false, error: "Only Super Admins can delete users." },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
      }

      if (id === admin.id) {
        return NextResponse.json(
          { success: false, error: "You cannot delete your own Super Admin account." },
          { status: 400 }
        );
      }

      await AdminRepository.deleteUser(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "DELETE_ADMIN_USER",
        module: "USERS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Deleted user ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "User deleted." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to delete user" },
        { status: 500 }
      );
    }
  });
}
