import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

const ALLOWED_PLACEHOLDERS = [
  "customer_name",
  "customer_email",
  "company_name",
  "service_name",
  "meeting_date",
  "meeting_link",
  "project_name",
];

export async function GET(req) {
  return withAdminAuth(req, "templates", async () => {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "all";

    const db = getDb();
    let templates = [...(db.templates || [])];

    if (category !== "all") {
      templates = templates.filter((t) => t.category === category);
    }

    return NextResponse.json({
      success: true,
      templates,
      allowedPlaceholders: ALLOWED_PLACEHOLDERS,
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "templates", async () => {
    const body = await req.json().catch(() => ({}));
    const { name, category, subject, content } = body;

    if (!name || !subject || !content) {
      return NextResponse.json({ success: false, error: "Name, subject, and content are required" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    // Extract placeholders
    const matches = (subject + " " + content).match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    const usedPlaceholders = [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];

    const newTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      category: category || "General",
      subject,
      content,
      placeholders: usedPlaceholders,
      createdAt: now,
      updatedAt: now,
    };

    if (!db.templates) db.templates = [];
    db.templates.unshift(newTemplate);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CREATE_TEMPLATE",
      module: "TEMPLATES",
      recordId: newTemplate.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Created template ${newTemplate.name}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, template: newTemplate });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "templates", async () => {
    const body = await req.json().catch(() => ({}));
    const { id, name, category, subject, content } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Template ID required" }, { status: 400 });
    }

    const db = getDb();
    const template = (db.templates || []).find((t) => t.id === id);

    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }

    if (name) template.name = name;
    if (category) template.category = category;
    if (subject) template.subject = subject;
    if (content) template.content = content;

    const matches = ((subject || template.subject) + " " + (content || template.content)).match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
    template.placeholders = [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
    template.updatedAt = new Date().toISOString();

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_TEMPLATE",
      module: "TEMPLATES",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated template ${template.name}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, template });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "templates", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Template ID required" }, { status: 400 });
    }

    const db = getDb();
    db.templates = (db.templates || []).filter((t) => t.id !== id);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELETE_TEMPLATE",
      module: "TEMPLATES",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Deleted template ${id}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Template deleted." });
  });
}
