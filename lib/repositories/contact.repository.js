import { getAdminClient } from "@/lib/supabase/admin";

export const ContactRepository = {
  async create({
    name,
    email,
    companyName,
    service,
    subject,
    message,
    budget,
    timeline,
    sourcePage = "/contact",
    clientIp,
    assignedTo,
  }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        name,
        email: email.trim().toLowerCase(),
        company_name: companyName || "",
        service: service || "General Inquiry",
        subject: subject || "Website Inquiry",
        message,
        budget: budget || "",
        timeline: timeline || "",
        source_page: sourcePage,
        status: "new",
        client_ip: clientIp || "",
        assigned_to: assignedTo || null,
        notes: [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      companyName: data.company_name,
      service: data.service,
      subject: data.subject,
      message: data.message,
      budget: data.budget,
      timeline: data.timeline,
      sourcePage: data.source_page,
      status: data.status,
      assignedTo: data.assigned_to,
      notes: data.notes || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async list({ page = 1, limit = 50, status, search, assignedTo } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("contacts").select("*", { count: "exact" });

    if (status && status !== "all") query = query.eq("status", status);
    if (assignedTo) query = query.eq("assigned_to", assignedTo);
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%,subject.ilike.%${search}%`
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      contacts: (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        companyName: c.company_name,
        service: c.service,
        subject: c.subject,
        message: c.message,
        budget: c.budget,
        timeline: c.timeline,
        sourcePage: c.source_page,
        status: c.status,
        assignedTo: c.assigned_to,
        notes: c.notes || [],
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
      .from("contacts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      companyName: data.company_name,
      service: data.service,
      subject: data.subject,
      message: data.message,
      budget: data.budget,
      timeline: data.timeline,
      sourcePage: data.source_page,
      status: data.status,
      assignedTo: data.assigned_to,
      notes: data.notes || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async update(id, updates = {}) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo || null;
    if (updates.companyName !== undefined) payload.company_name = updates.companyName;
    if (updates.service !== undefined) payload.service = updates.service;
    if (updates.subject !== undefined) payload.subject = updates.subject;
    if (updates.budget !== undefined) payload.budget = updates.budget;
    if (updates.timeline !== undefined) payload.timeline = updates.timeline;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { data, error } = await supabase
      .from("contacts")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      companyName: data.company_name,
      service: data.service,
      subject: data.subject,
      message: data.message,
      budget: data.budget,
      timeline: data.timeline,
      sourcePage: data.source_page,
      status: data.status,
      assignedTo: data.assigned_to,
      notes: data.notes || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async delete(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  async addNote(id, noteText, author = "Admin") {
    const current = await this.findById(id);
    if (!current) throw new Error("Contact not found.");
    const notes = Array.isArray(current.notes) ? [...current.notes] : [];
    notes.push({
      id: `note_${Date.now()}`,
      author,
      text: noteText,
      createdAt: new Date().toISOString(),
    });
    return this.update(id, { notes });
  },
};
