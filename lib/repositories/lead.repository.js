import { getAdminClient } from "@/lib/supabase/admin";

export const LeadRepository = {
  async create({
    contactId,
    name,
    email,
    companyName,
    service,
    stage = "new",
    estimatedValue = 0,
    source = "Website Contact Form",
    assignedTo,
    notes = [],
  }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        contact_id: contactId || null,
        name,
        email: email.trim().toLowerCase(),
        company_name: companyName || "",
        service: service || "",
        stage,
        estimated_value: Number(estimatedValue) || 0,
        source,
        assigned_to: assignedTo || null,
        notes: notes || [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      contactId: data.contact_id,
      name: data.name,
      email: data.email,
      companyName: data.company_name,
      service: data.service,
      stage: data.stage,
      estimatedValue: Number(data.estimated_value) || 0,
      source: data.source,
      assignedTo: data.assigned_to,
      notes: data.notes || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async list({ page = 1, limit = 50, stage, search, assignedTo } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("leads").select("*", { count: "exact" });

    if (stage && stage !== "all") query = query.eq("stage", stage);
    if (assignedTo) query = query.eq("assigned_to", assignedTo);
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%,service.ilike.%${search}%`
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      leads: (data || []).map((l) => ({
        id: l.id,
        contactId: l.contact_id,
        name: l.name,
        email: l.email,
        companyName: l.company_name,
        service: l.service,
        stage: l.stage,
        estimatedValue: Number(l.estimated_value) || 0,
        source: l.source,
        assignedTo: l.assigned_to,
        notes: l.notes || [],
        createdAt: l.created_at,
        updatedAt: l.updated_at,
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
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      contactId: data.contact_id,
      name: data.name,
      email: data.email,
      companyName: data.company_name,
      service: data.service,
      stage: data.stage,
      estimatedValue: Number(data.estimated_value) || 0,
      source: data.source,
      assignedTo: data.assigned_to,
      notes: data.notes || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async update(id, updates = {}) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
    if (updates.companyName !== undefined) payload.company_name = updates.companyName;
    if (updates.service !== undefined) payload.service = updates.service;
    if (updates.stage !== undefined) payload.stage = updates.stage;
    if (updates.estimatedValue !== undefined) payload.estimated_value = Number(updates.estimatedValue) || 0;
    if (updates.source !== undefined) payload.source = updates.source;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo || null;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      contactId: data.contact_id,
      name: data.name,
      email: data.email,
      companyName: data.company_name,
      service: data.service,
      stage: data.stage,
      estimatedValue: Number(data.estimated_value) || 0,
      source: data.source,
      assignedTo: data.assigned_to,
      notes: data.notes || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async delete(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  async addNote(id, noteText, author = "Admin") {
    const current = await this.findById(id);
    if (!current) throw new Error("Lead not found.");
    const notes = Array.isArray(current.notes) ? [...current.notes] : [];
    notes.push({
      id: `lead_note_${Date.now()}`,
      author,
      text: noteText,
      createdAt: new Date().toISOString(),
    });
    return this.update(id, { notes });
  },
};
