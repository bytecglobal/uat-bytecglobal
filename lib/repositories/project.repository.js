import { getAdminClient } from "@/lib/supabase/admin";

export const ProjectRepository = {
  async create({
    clientId,
    clientName,
    title,
    category = "Custom Software",
    description = "",
    startDate,
    deadline,
    budget = 0,
    priority = "medium",
    status = "planning",
    progress = 0,
    assignedTeam = [],
    tasks = [],
  }) {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        client_id: clientId || null,
        client_name: clientName || "",
        title,
        category,
        description,
        start_date: startDate || null,
        deadline: deadline || null,
        budget: Number(budget) || 0,
        priority,
        status,
        progress: Number(progress) || 0,
        assigned_team: assignedTeam || [],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    let createdTasks = [];
    if (Array.isArray(tasks) && tasks.length > 0) {
      const taskInserts = tasks.map((t, index) => ({
        project_id: data.id,
        title: t.title || t,
        completed: Boolean(t.completed),
        due_date: t.dueDate || null,
        display_order: index + 1,
      }));
      const { data: tData } = await supabase.from("project_tasks").insert(taskInserts).select();
      createdTasks = tData || [];
    }

    return {
      id: data.id,
      clientId: data.client_id,
      clientName: data.client_name,
      title: data.title,
      category: data.category,
      description: data.description,
      startDate: data.start_date,
      deadline: data.deadline,
      budget: Number(data.budget) || 0,
      priority: data.priority,
      status: data.status,
      progress: data.progress,
      assignedTeam: data.assigned_team || [],
      tasks: createdTasks.map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        dueDate: t.due_date,
      })),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async list({ page = 1, limit = 50, status, priority, clientId, search } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("projects").select("*, project_tasks(*)", { count: "exact" });

    if (status && status !== "all") query = query.eq("status", status);
    if (priority && priority !== "all") query = query.eq("priority", priority);
    if (clientId) query = query.eq("client_id", clientId);
    if (search) {
      query = query.or(`title.ilike.%${search}%,client_name.ilike.%${search}%,category.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      projects: (data || []).map((p) => ({
        id: p.id,
        clientId: p.client_id,
        clientName: p.client_name,
        title: p.title,
        category: p.category,
        description: p.description,
        startDate: p.start_date,
        deadline: p.deadline,
        budget: Number(p.budget) || 0,
        priority: p.priority,
        status: p.status,
        progress: p.progress,
        assignedTeam: p.assigned_team || [],
        tasks: (p.project_tasks || [])
          .sort((a, b) => a.display_order - b.display_order)
          .map((t) => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
            dueDate: t.due_date,
          })),
        createdAt: p.created_at,
        updatedAt: p.updated_at,
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
      .from("projects")
      .select("*, project_tasks(*)")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      clientId: data.client_id,
      clientName: data.client_name,
      title: data.title,
      category: data.category,
      description: data.description,
      startDate: data.start_date,
      deadline: data.deadline,
      budget: Number(data.budget) || 0,
      priority: data.priority,
      status: data.status,
      progress: data.progress,
      assignedTeam: data.assigned_team || [],
      tasks: (data.project_tasks || [])
        .sort((a, b) => a.display_order - b.display_order)
        .map((t) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          dueDate: t.due_date,
        })),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async update(id, updates = {}) {
    const supabase = getAdminClient();
    const payload = {};
    if (updates.clientId !== undefined) payload.client_id = updates.clientId || null;
    if (updates.clientName !== undefined) payload.client_name = updates.clientName;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.startDate !== undefined) payload.start_date = updates.startDate || null;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline || null;
    if (updates.budget !== undefined) payload.budget = Number(updates.budget) || 0;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.progress !== undefined) payload.progress = Number(updates.progress) || 0;
    if (updates.assignedTeam !== undefined) payload.assigned_team = updates.assignedTeam;

    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    // If tasks are provided, sync tasks
    if (Array.isArray(updates.tasks)) {
      await supabase.from("project_tasks").delete().eq("project_id", id);
      if (updates.tasks.length > 0) {
        const taskInserts = updates.tasks.map((t, index) => ({
          project_id: id,
          title: t.title || t,
          completed: Boolean(t.completed),
          due_date: t.dueDate || null,
          display_order: index + 1,
        }));
        await supabase.from("project_tasks").insert(taskInserts);
      }
    }

    return this.findById(id);
  },

  async delete(id) {
    const supabase = getAdminClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },
};
