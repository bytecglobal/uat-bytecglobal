import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "leads", async () => {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") || "all";
    const search = (searchParams.get("search") || "").toLowerCase();

    const db = getDb();
    let leads = [...(db.leads || [])];

    if (search) {
      leads = leads.filter(
        (l) =>
          l.name.toLowerCase().includes(search) ||
          l.email.toLowerCase().includes(search) ||
          (l.companyName || "").toLowerCase().includes(search) ||
          (l.service || "").toLowerCase().includes(search)
      );
    }

    if (stage !== "all") {
      leads = leads.filter((l) => l.stage === stage);
    }

    return NextResponse.json({
      success: true,
      leads,
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "leads", async () => {
    const body = await req.json().catch(() => ({}));
    const { action, leadId, name, email, phone, companyName, service, stage, estimatedValue } = body;
    const db = getDb();
    const now = new Date().toISOString();

    // Convert lead to client
    if (action === "convert_to_client" && leadId) {
      const lead = (db.leads || []).find((l) => l.id === leadId);
      if (!lead) {
        return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
      }

      lead.stage = "won";
      lead.updatedAt = now;

      const newClient = {
        id: `cli_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: lead.companyName || lead.name,
        contactPerson: lead.name,
        email: lead.email,
        phone: lead.phone || "",
        industry: lead.service || "Enterprise",
        status: "active",
        totalValue: Number(lead.estimatedValue) || 20000,
        notes: `Converted from lead ${lead.id}. Interested in ${lead.service}.`,
        createdAt: now,
        updatedAt: now,
      };

      if (!db.clients) db.clients = [];
      db.clients.unshift(newClient);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CONVERT_LEAD_TO_CLIENT",
        module: "LEADS",
        recordId: leadId,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Converted lead ${leadId} into client ${newClient.id}.`,
        result: "success",
      });

      await saveDb(db);
      return NextResponse.json({ success: true, client: newClient, lead });
    }

    // Manual lead creation
    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
    }

    const newLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      email,
      phone: phone || "",
      companyName: companyName || "",
      service: service || "General Software Services",
      stage: stage || "new",
      estimatedValue: Number(estimatedValue) || 10000,
      source: "Admin Created",
      assignedTo: admin.id,
      notes: [],
      createdAt: now,
      updatedAt: now,
    };

    if (!db.leads) db.leads = [];
    db.leads.unshift(newLead);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CREATE_LEAD",
      module: "LEADS",
      recordId: newLead.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Created new lead ${newLead.id} for ${email}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, lead: newLead });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "leads", async () => {
    const body = await req.json().catch(() => ({}));
    const { id, stage, estimatedValue, noteText } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Lead ID required" }, { status: 400 });
    }

    const db = getDb();
    const lead = (db.leads || []).find((l) => l.id === id);

    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (stage) lead.stage = stage;
    if (estimatedValue !== undefined) lead.estimatedValue = Number(estimatedValue);

    if (noteText) {
      if (!lead.notes) lead.notes = [];
      lead.notes.push({
        id: `note_${Date.now()}`,
        author: admin.name || admin.email,
        text: noteText,
        createdAt: now,
      });
    }

    lead.updatedAt = now;

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_LEAD",
      module: "LEADS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated lead ${id} (Stage: ${stage || lead.stage}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, lead });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "leads", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Lead ID required" }, { status: 400 });
    }

    const db = getDb();
    db.leads = (db.leads || []).filter((l) => l.id !== id);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELETE_LEAD",
      module: "LEADS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Deleted lead ${id}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Lead deleted." });
  });
}
