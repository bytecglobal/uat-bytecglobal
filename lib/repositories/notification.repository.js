import { getAdminClient } from "@/lib/supabase/admin";

export const NotificationRepository = {
  async create({ title, message, category = "general", link = "/admin/dashboard" }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        category,
        link,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.warn("Notification creation error:", error.message);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      message: data.message,
      category: data.category,
      read: data.read,
      link: data.link,
      createdAt: data.created_at,
    };
  },

  async list({ page = 1, limit = 50, unreadOnly = false } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("notifications").select("*", { count: "exact" });

    if (unreadOnly) query = query.eq("read", false);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const unreadCount = (data || []).filter((n) => !n.read).length;

    return {
      notifications: (data || []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        category: n.category,
        read: n.read,
        link: n.link,
        createdAt: n.created_at,
      })),
      total: count || 0,
      unreadCount,
      page,
      limit,
    };
  },

  async markAsRead(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  async markAllAsRead() {
    const supabase = getAdminClient();
    const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
    if (error) throw new Error(error.message);
    return true;
  },

  async delete(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  async deleteAll() {
    const supabase = getAdminClient();
    const { error } = await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);
    return true;
  },
};
