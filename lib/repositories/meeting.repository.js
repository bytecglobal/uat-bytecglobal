import { getAdminClient } from "@/lib/supabase/admin";

export const MeetingRepository = {
  async create({
    clientName,
    clientEmail,
    title,
    meetingDate,
    meetingTime,
    durationMinutes = 30,
    status = "requested",
    meetingLink = "",
    notes = "",
    source = "website",
  }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        client_name: clientName,
        client_email: clientEmail.trim().toLowerCase(),
        title,
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        duration_minutes: Number(durationMinutes) || 30,
        status,
        meeting_link: meetingLink || "",
        notes: notes || "",
        source: source || "website",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      clientName: data.client_name,
      clientEmail: data.client_email,
      title: data.title,
      date: data.meeting_date,
      time: data.meeting_time,
      durationMinutes: data.duration_minutes,
      status: data.status,
      meetingLink: data.meeting_link,
      notes: data.notes,
      source: data.source,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async list({ page = 1, limit = 50, status, search, fromDate, toDate } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("meetings").select("*", { count: "exact" });

    if (status && status !== "all") query = query.eq("status", status);
    if (fromDate) query = query.gte("meeting_date", fromDate);
    if (toDate) query = query.lte("meeting_date", toDate);
    if (search) {
      query = query.or(`client_name.ilike.%${search}%,client_email.ilike.%${search}%,title.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("meeting_date", { ascending: true }).order("meeting_time", { ascending: true }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      meetings: (data || []).map((m) => ({
        id: m.id,
        clientName: m.client_name,
        clientEmail: m.client_email,
        title: m.title,
        date: m.meeting_date,
        time: m.meeting_time,
        durationMinutes: m.duration_minutes,
        status: m.status,
        meetingLink: m.meeting_link,
        notes: m.notes,
        source: m.source,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
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
      .from("meetings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      clientName: data.client_name,
      clientEmail: data.client_email,
      title: data.title,
      date: data.meeting_date,
      time: data.meeting_time,
      durationMinutes: data.duration_minutes,
      status: data.status,
      meetingLink: data.meeting_link,
      notes: data.notes,
      source: data.source,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async update(id, updates = {}) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.clientName !== undefined) payload.client_name = updates.clientName;
    if (updates.clientEmail !== undefined) payload.client_email = updates.clientEmail.trim().toLowerCase();
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.date !== undefined || updates.meetingDate !== undefined) {
      payload.meeting_date = updates.date || updates.meetingDate;
    }
    if (updates.time !== undefined || updates.meetingTime !== undefined) {
      payload.meeting_time = updates.time || updates.meetingTime;
    }
    if (updates.durationMinutes !== undefined) payload.duration_minutes = Number(updates.durationMinutes) || 30;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.meetingLink !== undefined) payload.meeting_link = updates.meetingLink;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.source !== undefined) payload.source = updates.source;

    const { data, error } = await supabase
      .from("meetings")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      clientName: data.client_name,
      clientEmail: data.client_email,
      title: data.title,
      date: data.meeting_date,
      time: data.meeting_time,
      durationMinutes: data.duration_minutes,
      status: data.status,
      meetingLink: data.meeting_link,
      notes: data.notes,
      source: data.source,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async delete(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },
};
