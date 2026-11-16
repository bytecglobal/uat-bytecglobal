import { getAdminClient } from "@/lib/supabase/admin";

export const AdminRepository = {
  async findByEmail(email) {
    if (!email) return null;
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .ilike("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      passwordHash: data.password_hash,
      role: data.role,
      status: data.status,
      failedAttempts: data.failed_attempts,
      lockoutUntil: data.lockout_until,
      lastLogin: data.last_login,
      passwordChangedAt: data.password_changed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async findById(id) {
    if (!id) return null;
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      passwordHash: data.password_hash,
      role: data.role,
      status: data.status,
      failedAttempts: data.failed_attempts,
      lockoutUntil: data.lockout_until,
      lastLogin: data.last_login,
      passwordChangedAt: data.password_changed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async listUsers({ page = 1, limit = 50, role, status, search } = {}) {
    const supabase = getAdminClient();
    let query = supabase
      .from("admin_users")
      .select("id, name, email, role, status, failed_attempts, lockout_until, last_login, created_at, updated_at", { count: "exact" });

    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      users: (data || []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        failedAttempts: u.failed_attempts,
        lockoutUntil: u.lockout_until,
        isLocked: Boolean(u.lockout_until && new Date(u.lockout_until) > new Date()),
        lastLogin: u.last_login,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      })),
      total: count || 0,
      page,
      limit,
    };
  },

  async createUser({ name, email, passwordHash, role = "ADMIN", status = "active" }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("admin_users")
      .insert({
        name,
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        role,
        status,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
    };
  },

  async updateUser(id, updates = {}) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.passwordHash !== undefined) {
      payload.password_hash = updates.passwordHash;
      payload.password_changed_at = new Date().toISOString();
    }
    if (updates.failedAttempts !== undefined) payload.failed_attempts = updates.failedAttempts;
    if (updates.lockoutUntil !== undefined) payload.lockout_until = updates.lockoutUntil;
    if (updates.lastLogin !== undefined) payload.last_login = updates.lastLogin;

    const { data, error } = await supabase
      .from("admin_users")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      lastLogin: data.last_login,
      updatedAt: data.updated_at,
    };
  },

  async deleteUser(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("admin_users").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  async recordFailedAttempt(id, currentAttempts, maxAttempts = 5, lockoutMinutes = 15) {
    const attempts = (currentAttempts || 0) + 1;
    const updates = { failedAttempts: attempts };
    if (attempts >= maxAttempts) {
      updates.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60000).toISOString();
    }
    return this.updateUser(id, updates);
  },

  async resetFailedAttempts(id) {
    return this.updateUser(id, { failedAttempts: 0, lockoutUntil: null });
  },

  async updateLastLogin(id) {
    return this.updateUser(id, {
      failedAttempts: 0,
      lockoutUntil: null,
      lastLogin: new Date().toISOString(),
    });
  },

  async createPasswordResetToken(userId, tokenHash, expiresAt) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async findPasswordResetToken(tokenHash) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("password_reset_tokens")
      .select("*, admin_users(*)")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },

  async markPasswordResetTokenUsed(id) {
    const supabase = getAdminClient();
    await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", id);
  },

  async recordAuditLog({ adminId, adminEmail, action, module, recordId, ip, details, result }) {
    try {
      const supabase = getAdminClient();
      await supabase.from("audit_logs").insert({
        admin_id: String(adminId || "system"),
        admin_email: String(adminEmail || "system"),
        action: String(action || "UNKNOWN"),
        module: String(module || "SYSTEM"),
        record_id: String(recordId || ""),
        ip: String(ip || "127.0.0.1"),
        details: String(details || ""),
        result: result === "failure" || result === "error" ? result : "success",
      });
    } catch (err) {
      console.error("Audit log insertion error:", err);
    }
  },

  async listAuditLogs({ page = 1, limit = 50, module, search } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("audit_logs").select("*", { count: "exact" });

    if (module && module !== "ALL") query = query.eq("module", module.toUpperCase());
    if (search) {
      query = query.or(`admin_email.ilike.%${search}%,action.ilike.%${search}%,details.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("timestamp", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      logs: (data || []).map((l) => ({
        id: l.id,
        adminId: l.admin_id,
        adminEmail: l.admin_email,
        action: l.action,
        module: l.module,
        recordId: l.record_id,
        ip: l.ip,
        details: l.details,
        result: l.result,
        timestamp: l.timestamp,
      })),
      total: count || 0,
      page,
      limit,
    };
  },
};
