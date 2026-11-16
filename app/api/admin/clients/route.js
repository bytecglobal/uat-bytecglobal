import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { ClientRepository } from "@/lib/repositories/client.repository";
import { ProjectRepository } from "@/lib/repositories/project.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "clients", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search") || "";

      const { clients } = await ClientRepository.list({ search, limit: 100 });
      const { projects } = await ProjectRepository.list({ limit: 500 });

      // Attach active projects
      const enriched = clients.map((c) => {
        const clientProjects = projects.filter((p) => p.clientId === c.id);
        return {
          ...c,
          projectsCount: clientProjects.length,
          projects: clientProjects.map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            progress: p.progress,
          })),
        };
      });

      return NextResponse.json({
        success: true,
        clients: enriched,
      });
    } catch (err) {
      console.error("Clients GET error:", err);
      return NextResponse.json({ success: false, error: "Failed to retrieve clients." }, { status: 500 });
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "clients", async (r, admin) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { name, contactPerson, email, industry, totalValue, notes, status } = body;

      if (!name || !email) {
        return NextResponse.json({ success: false, error: "Company name and email are required" }, { status: 400 });
      }

      const newClient = await ClientRepository.create({
        name,
        contactPerson: contactPerson || name,
        email,
        industry: industry || "Technology",
        status: status || "active",
        totalValue: Number(totalValue) || 0,
        notes: notes || "",
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CREATE_CLIENT",
        module: "CLIENTS",
        recordId: newClient.id,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Created client ${newClient.id} (${name}).`,
        result: "success",
      });

      return NextResponse.json({ success: true, client: newClient });
    } catch (err) {
      console.error("Clients POST error:", err);
      return NextResponse.json({ success: false, error: "Failed to create client." }, { status: 500 });
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "clients", async (r, admin) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { id, name, contactPerson, email, industry, totalValue, notes, status } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 });
      }

      const updated = await ClientRepository.update(id, {
        name,
        contactPerson,
        email,
        industry,
        totalValue,
        notes,
        status,
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_CLIENT",
        module: "CLIENTS",
        recordId: id,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Updated client ${id} (${updated.name}).`,
        result: "success",
      });

      return NextResponse.json({ success: true, client: updated });
    } catch (err) {
      console.error("Clients PATCH error:", err);
      return NextResponse.json({ success: false, error: "Failed to update client." }, { status: 500 });
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "clients", async (r, admin) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 });
      }

      await ClientRepository.delete(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "DELETE_CLIENT",
        module: "CLIENTS",
        recordId: id,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Deleted client ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Client deleted." });
    } catch (err) {
      console.error("Clients DELETE error:", err);
      return NextResponse.json({ success: false, error: "Failed to delete client." }, { status: 500 });
    }
  });
}
