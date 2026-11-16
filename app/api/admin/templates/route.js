import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { SettingsRepository } from "@/lib/repositories/settings.repository";
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
    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get("category") || "all";

      let templates = await SettingsRepository.listEmailTemplates();
      if (category !== "all") {
        templates = templates.filter((t) => t.category === category);
      }

      return NextResponse.json({
        success: true,
        templates,
        allowedPlaceholders: ALLOWED_PLACEHOLDERS,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch email templates" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "templates", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { name, category, subject, content } = body;

      if (!name || !subject || !content) {
        return NextResponse.json(
          { success: false, error: "Name, subject, and content are required" },
          { status: 400 }
        );
      }

      // Extract placeholders
      const matches = (subject + " " + content).match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
      const usedPlaceholders = [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];

      const template = await SettingsRepository.createEmailTemplate({
        name,
        category: category || "General",
        subject,
        content,
        placeholders: usedPlaceholders,
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CREATE_TEMPLATE",
        module: "TEMPLATES",
        recordId: template.id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Created template ${template.name}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, template });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to create template" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "templates", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { id, name, category, subject, content } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Template ID required" }, { status: 400 });
      }

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (category !== undefined) updates.category = category;
      if (subject !== undefined) updates.subject = subject;
      if (content !== undefined) updates.content = content;

      if (subject || content) {
        const combined = `${subject || ""} ${content || ""}`;
        const matches = combined.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
        if (matches.length > 0) {
          updates.placeholders = [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
        }
      }

      const template = await SettingsRepository.updateEmailTemplate(id, updates);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_TEMPLATE",
        module: "TEMPLATES",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Updated template ${template?.name || id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, template });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to update template" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "templates", async (request, admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Template ID required" }, { status: 400 });
      }

      await SettingsRepository.deleteEmailTemplate(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "DELETE_TEMPLATE",
        module: "TEMPLATES",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Deleted template ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Template deleted." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to delete template" },
        { status: 500 }
      );
    }
  });
}
