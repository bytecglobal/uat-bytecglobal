import { getAdminClient } from "@/lib/supabase/admin";

export const ClientRepository = {
  async create({
    name,
    contactPerson,
    email,
    industry,
    status = "active",
    totalValue = 0,
    notes = "",
  }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name,
        contact_person: contactPerson || "",
        email: email.trim().toLowerCase(),
        industry: industry || "",
        status,
        total_value: Number(totalValue) || 0,
        notes: notes || "",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person,
      email: data.email,
      industry: data.industry,
      status: data.status,
      totalValue: Number(data.total_value) || 0,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async list({ page = 1, limit = 50, status, search } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("clients").select("*", { count: "exact" });

    if (status && status !== "all") query = query.eq("status", status);
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,contact_person.ilike.%${search}%,industry.ilike.%${search}%`
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      clients: (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        contactPerson: c.contact_person,
        email: c.email,
        industry: c.industry,
        status: c.status,
        totalValue: Number(c.total_value) || 0,
        notes: c.notes,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      total: count || 0,
      page,
      limit,
    };
  },

  async findById(id) {
    if (!id) return null;
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person,
      email: data.email,
      industry: data.industry,
      status: data.status,
      totalValue: Number(data.total_value) || 0,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async update(id, updates = {}) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.contactPerson !== undefined) payload.contact_person = updates.contactPerson;
    if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
    if (updates.industry !== undefined) payload.industry = updates.industry;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.totalValue !== undefined) payload.total_value = Number(updates.totalValue) || 0;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person,
      email: data.email,
      industry: data.industry,
      status: data.status,
      totalValue: Number(data.total_value) || 0,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async delete(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },
};
