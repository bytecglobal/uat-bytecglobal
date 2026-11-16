import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { triggerWorkflow } from "@/lib/automations";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "automations", async () => {
    const db = getDb();
    return NextResponse.json({
      success: true,
      automations: db.automations || [],
      logs: (db.automation_logs || []).slice(0, 30),
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "automations", async () => {
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

    const db = getDb();
    const now = new Date().toISOString();

    const newAutomation = {
      id: `aut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      trigger,
      description: description || "",
      enabled: true,
      actions: Array.isArray(actions) ? actions : [{ type: "notify_admin", params: {} }],
      executionCount: 0,
      lastRunAt: null,
      createdAt: now,
    };

    if (!db.automations) db.automations = [];
    db.automations.unshift(newAutomation);

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

    await saveDb(db);
    return NextResponse.json({ success: true, automation: newAutomation });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "automations", async () => {
    const body = await req.json().catch(() => ({}));
    const { id, enabled, name, description, actions } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Automation ID required" }, { status: 400 });
    }

    const db = getDb();
    const automation = (db.automations || []).find((a) => a.id === id);

    if (!automation) {
      return NextResponse.json({ success: false, error: "Automation not found" }, { status: 404 });
    }

    if (enabled !== undefined) automation.enabled = Boolean(enabled);
    if (name) automation.name = name;
    if (description !== undefined) automation.description = description;
    if (actions) automation.actions = actions;

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_AUTOMATION",
      module: "AUTOMATIONS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated automation ${automation.name} (Enabled: ${automation.enabled}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, automation });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "automations", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Automation ID required" }, { status: 400 });
    }

    const db = getDb();
    db.automations = (db.automations || []).filter((a) => a.id !== id);

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

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Automation deleted." });
  });
}
