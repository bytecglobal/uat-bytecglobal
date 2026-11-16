import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { ProjectRepository } from "@/lib/repositories/project.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "projects", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status") || "all";
      const search = searchParams.get("search") || "";

      const result = await ProjectRepository.list({
        status,
        search,
        limit: 100,
      });

      return NextResponse.json({
        success: true,
        projects: result.projects,
        total: result.total,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch projects" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "projects", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { title, clientId, clientName, category, description, startDate, deadline, budget, priority, assignedTeam } = body;

      if (!title || !clientName) {
        return NextResponse.json(
          { success: false, error: "Project title and client are required" },
          { status: 400 }
        );
      }

      const project = await ProjectRepository.create({
        title,
        clientId: clientId || null,
        clientName,
        category: category || "Software Development",
        description: description || "",
        startDate: startDate || new Date().toISOString().split("T")[0],
        deadline: deadline || null,
        budget: Number(budget) || 0,
        priority: priority || "medium",
        status: "planning",
        progress: 0,
        assignedTeam: Array.isArray(assignedTeam) ? assignedTeam : [admin.name || "Bytec Admin"],
        tasks: [],
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CREATE_PROJECT",
        module: "PROJECTS",
        recordId: project.id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Created project ${project.id} (${title}).`,
        result: "success",
      });

      return NextResponse.json({ success: true, project });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to create project" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "projects", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { id, title, status, progress, priority, budget, deadline, taskToggleId, newTaskTitle } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Project ID required" }, { status: 400 });
      }

      const project = await ProjectRepository.findById(id);
      if (!project) {
        return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
      }

      const updates = {};
      if (title) updates.title = title;
      if (status) updates.status = status;
      if (progress !== undefined) updates.progress = Math.min(100, Math.max(0, Number(progress)));
      if (priority) updates.priority = priority;
      if (budget !== undefined) updates.budget = Number(budget);
      if (deadline) updates.deadline = deadline;

      let currentTasks = Array.isArray(project.tasks) ? [...project.tasks] : [];

      if (taskToggleId) {
        currentTasks = currentTasks.map((t) =>
          t.id === taskToggleId ? { ...t, completed: !t.completed } : t
        );
        if (currentTasks.length > 0) {
          const completedCount = currentTasks.filter((t) => t.completed).length;
          updates.progress = Math.round((completedCount / currentTasks.length) * 100);
        }
        updates.tasks = currentTasks;
      }

      if (newTaskTitle) {
        currentTasks.push({
          title: newTaskTitle,
          completed: false,
        });
        const completedCount = currentTasks.filter((t) => t.completed).length;
        updates.progress = Math.round((completedCount / currentTasks.length) * 100);
        updates.tasks = currentTasks;
      }

      const updated = await ProjectRepository.update(id, updates);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_PROJECT",
        module: "PROJECTS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Updated project ${id} (${updated?.title || title}).`,
        result: "success",
      });

      return NextResponse.json({ success: true, project: updated });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to update project" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "projects", async (request, admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Project ID required" }, { status: 400 });
      }

      await ProjectRepository.delete(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "DELETE_PROJECT",
        module: "PROJECTS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Deleted project ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Project deleted." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to delete project" },
        { status: 500 }
      );
    }
  });
}
