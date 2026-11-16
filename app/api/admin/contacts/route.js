import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "contacts", async () => {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase();
    const status = searchParams.get("status") || "all";
    const format = searchParams.get("format");

    const db = getDb();
    let contacts = [...(db.contacts || [])];

    if (search) {
      contacts = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          (c.companyName || "").toLowerCase().includes(search) ||
          (c.service || "").toLowerCase().includes(search)
      );
    }

    if (status !== "all") {
      contacts = contacts.filter((c) => c.status === status);
    }

    if (format === "csv") {
      const headers = "ID,Name,Email,Phone,Company,Service,Status,Created At\n";
      const rows = contacts
        .map(
          (c) =>
            `"${c.id}","${c.name}","${c.email}","${c.phone || ""}","${c.companyName || ""}","${c.service}","${c.status}","${c.createdAt}"`
        )
        .join("\n");

      return new NextResponse(headers + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="bytec_contacts.csv"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      contacts,
      totalCount: contacts.length,
    });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "contacts", async () => {
    const body = await req.json().catch(() => ({}));
    const { id, status, assignedTo, noteText } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Contact ID required" }, { status: 400 });
    }

    const db = getDb();
    const contact = (db.contacts || []).find((c) => c.id === id);

    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (status) contact.status = status;
    if (assignedTo !== undefined) contact.assignedTo = assignedTo;

    if (noteText) {
      if (!contact.notes) contact.notes = [];
      contact.notes.push({
        id: `note_${Date.now()}`,
        author: admin.name || admin.email,
        text: noteText,
        createdAt: now,
      });
    }

    contact.updatedAt = now;

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_CONTACT",
      module: "CONTACTS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated contact ${id} (${status ? "Status: " + status : "Note added"}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, contact });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "contacts", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Contact ID required" }, { status: 400 });
    }

    const db = getDb();
    const initialLen = db.contacts.length;
    db.contacts = db.contacts.filter((c) => c.id !== id);

    if (db.contacts.length === initialLen) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELETE_CONTACT",
      module: "CONTACTS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Deleted contact record ${id}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Contact deleted successfully." });
  });
}
