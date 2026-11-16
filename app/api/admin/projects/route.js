import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "projects", async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const search = (searchParams.get("search") || "").toLowerCase();

    const db = getDb();
    let projects = [...(db.projects || [])];

    if (search) {
      projects = projects.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.clientName.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }

    if (status !== "all") {
      projects = projects.filter((p) => p.status === status);
    }

    return NextResponse.json({
      success: true,
      projects,
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "projects", async () => {
    const body = await req.json().catch(() => ({}));
    const { title, clientId, clientName, category, description, startDate, deadline, budget, priority, assignedTeam } = body;

    if (!title || !clientName) {
      return NextResponse.json({ success: false, error: "Project title and client are required" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const newProject = {
      id: `prj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      clientId: clientId || "",
      clientName,
      category: category || "Software Development",
      description: description || "",
      startDate: startDate || now.split("T")[0],
      deadline: deadline || "",
      budget: Number(budget) || 0,
      priority: priority || "medium",
      status: "planning",
      progress: 0,
      assignedTeam: Array.isArray(assignedTeam) ? assignedTeam : [admin.name || "Bytec Admin"],
      tasks: [],
      createdAt: now,
      updatedAt: now,
    };

    if (!db.projects) db.projects = [];
    db.projects.unshift(newProject);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CREATE_PROJECT",
      module: "PROJECTS",
      recordId: newProject.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Created project ${newProject.id} (${title}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, project: newProject });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "projects", async () => {
    const body = await req.json().catch(() => ({}));
    const { id, title, status, progress, priority, budget, deadline, taskToggleId, newTaskTitle } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Project ID required" }, { status: 400 });
    }

    const db = getDb();
    const project = (db.projects || []).find((p) => p.id === id);

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    if (title) project.title = title;
    if (status) project.status = status;
    if (progress !== undefined) project.progress = Math.min(100, Math.max(0, Number(progress)));
    if (priority) project.priority = priority;
    if (budget !== undefined) project.budget = Number(budget);
    if (deadline) project.deadline = deadline;

    if (!project.tasks) project.tasks = [];

    // Toggle existing task
    if (taskToggleId) {
      const task = project.tasks.find((t) => t.id === taskToggleId);
      if (task) {
        task.completed = !task.completed;
        // Recalculate progress if tasks exist
        const completed = project.tasks.filter((t) => t.completed).length;
        project.progress = Math.round((completed / project.tasks.length) * 100);
      }
    }

    // Add new task
    if (newTaskTitle) {
      project.tasks.push({
        id: `tsk_${Date.now()}`,
        title: newTaskTitle,
        completed: false,
      });
      const completed = project.tasks.filter((t) => t.completed).length;
      project.progress = Math.round((completed / project.tasks.length) * 100);
    }

    project.updatedAt = new Date().toISOString();

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_PROJECT",
      module: "PROJECTS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated project ${id} (${project.title}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, project });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "projects", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Project ID required" }, { status: 400 });
    }

    const db = getDb();
    db.projects = (db.projects || []).filter((p) => p.id !== id);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELETE_PROJECT",
      module: "PROJECTS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Deleted project ${id}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Project deleted." });
  });
}
