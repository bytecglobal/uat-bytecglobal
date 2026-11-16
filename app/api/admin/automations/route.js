import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { SettingsRepository } from "@/lib/repositories/settings.repository";
import { triggerWorkflow } from "@/lib/automations";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "automations", async () => {
    try {
      const [automations, { logs }] = await Promise.all([
        SettingsRepository.listAutomations(),
        SettingsRepository.listAutomationLogs({ limit: 30 }),
      ]);

      return NextResponse.json({
        success: true,
        automations,
        logs,
      });
    } catch (err) {
      console.error("Automations GET error:", err);
      return NextResponse.json({ success: false, error: "Failed to load automations." }, { status: 500 });
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "automations", async (r, admin) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { action, trigger, testPayload, name, description, actions } = body;

      // Trigger test run
      if (action === "test_trigger" && trigger) {
        const logs = await triggerWorkflow(trigger, testPayload || { name: "Test User", email: "test@example.com" });
        return NextResponse.json({ success: true, message: "Workflow triggered.", logs });
      }

      if (!name || !trigger) {
        return NextResponse.json({ success: false, error: "Name and trigger are required" }, { status: 400 });
      }

      const newAutomation = await SettingsRepository.createAutomation({
        name,
        trigger,
        description: description || "",
        enabled: true,
        actions: Array.isArray(actions) ? actions : [{ type: "notify_admin", params: {} }],
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CREATE_AUTOMATION",
        module: "AUTOMATIONS",
        recordId: newAutomation.id,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Created workflow automation ${newAutomation.name}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, automation: newAutomation });
    } catch (err) {
      console.error("Automations POST error:", err);
      return NextResponse.json({ success: false, error: "Failed to create automation." }, { status: 500 });
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "automations", async (r, admin) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { id, enabled, name, description, actions } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Automation ID required" }, { status: 400 });
      }

      const updated = await SettingsRepository.updateAutomation(id, {
        enabled,
        name,
        description,
        actions,
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_AUTOMATION",
        module: "AUTOMATIONS",
        recordId: id,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Updated automation ${updated.name} (Enabled: ${updated.enabled}).`,
        result: "success",
      });

      return NextResponse.json({ success: true, automation: updated });
    } catch (err) {
      console.error("Automations PATCH error:", err);
      return NextResponse.json({ success: false, error: "Failed to update automation." }, { status: 500 });
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "automations", async (r, admin) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Automation ID required" }, { status: 400 });
      }

      await SettingsRepository.deleteAutomation(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "DELETE_AUTOMATION",
        module: "AUTOMATIONS",
        recordId: id,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Deleted automation ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Automation deleted." });
    } catch (err) {
      console.error("Automations DELETE error:", err);
      return NextResponse.json({ success: false, error: "Failed to delete automation." }, { status: 500 });
    }
  });
}
