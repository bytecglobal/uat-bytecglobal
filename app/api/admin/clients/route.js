import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "clients", async () => {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase();

    const db = getDb();
    let clients = [...(db.clients || [])];

    if (search) {
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.contactPerson || "").toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          (c.industry || "").toLowerCase().includes(search)
      );
    }

    // Attach active project counts
    const enriched = clients.map((c) => {
      const activeProjects = (db.projects || []).filter((p) => p.clientId === c.id);
      return {
        ...c,
        projectsCount: activeProjects.length,
        projects: activeProjects.map((p) => ({ id: p.id, title: p.title, status: p.status, progress: p.progress })),
      };
    });

    return NextResponse.json({
      success: true,
      clients: enriched,
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "clients", async () => {
    const body = await req.json().catch(() => ({}));
    const { name, contactPerson, email, phone, industry, totalValue, notes, status } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Company name and email are required" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const newClient = {
      id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      contactPerson: contactPerson || name,
      email,
      phone: phone || "",
      industry: industry || "Technology",
      status: status || "active",
      totalValue: Number(totalValue) || 0,
      notes: notes || "",
      createdAt: now,
      updatedAt: now,
    };

    if (!db.clients) db.clients = [];
    db.clients.unshift(newClient);

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

    await saveDb(db);
    return NextResponse.json({ success: true, client: newClient });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "clients", async () => {
    const body = await req.json().catch(() => ({}));
    const { id, name, contactPerson, email, phone, industry, totalValue, notes, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 });
    }

    const db = getDb();
    const client = (db.clients || []).find((c) => c.id === id);

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    if (name) client.name = name;
    if (contactPerson) client.contactPerson = contactPerson;
    if (email) client.email = email;
    if (phone !== undefined) client.phone = phone;
    if (industry) client.industry = industry;
    if (totalValue !== undefined) client.totalValue = Number(totalValue);
    if (notes !== undefined) client.notes = notes;
    if (status) client.status = status;
    client.updatedAt = new Date().toISOString();

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_CLIENT",
      module: "CLIENTS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated client ${id} (${client.name}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, client });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "clients", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Client ID required" }, { status: 400 });
    }

    const db = getDb();
    db.clients = (db.clients || []).filter((c) => c.id !== id);

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

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Client deleted." });
  });
}
