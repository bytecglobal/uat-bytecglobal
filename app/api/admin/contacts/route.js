import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { ContactRepository } from "@/lib/repositories/contact.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "contacts", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get("search") || "";
      const status = searchParams.get("status") || "all";
      const format = searchParams.get("format");
      const limit = format === "csv" ? 1000 : 200;

      const { contacts, total } = await ContactRepository.list({
        search,
        status: status === "all" ? null : status,
        limit,
      });

      if (format === "csv") {
        const headers = "ID,Name,Email,Company,Service,Status,Created At\n";
        const rows = contacts
          .map(
            (c) =>
              `"${c.id}","${c.name}","${c.email}","${c.companyName || ""}","${c.service}","${c.status}","${c.createdAt}"`
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
        totalCount: total,
      });
    } catch (err) {
      console.error("Contacts GET error:", err);
      return NextResponse.json({ success: false, error: "Failed to retrieve contacts." }, { status: 500 });
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "contacts", async (r, admin) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { id, status, assignedTo, noteText } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Contact ID required" }, { status: 400 });
      }

      const updates = {};
      if (status) updates.status = status;
      if (assignedTo !== undefined) updates.assignedTo = assignedTo;

      let updatedContact = await ContactRepository.update(id, updates);

      if (noteText) {
        updatedContact = await ContactRepository.addNote(id, noteText, admin.name || admin.email);
      }

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

      return NextResponse.json({ success: true, contact: updatedContact });
    } catch (err) {
      console.error("Contacts PATCH error:", err);
      return NextResponse.json({ success: false, error: "Failed to update contact." }, { status: 500 });
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "contacts", async (r, admin) => {
    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Contact ID required" }, { status: 400 });
      }

      await ContactRepository.delete(id);

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

      return NextResponse.json({ success: true, message: "Contact deleted successfully." });
    } catch (err) {
      console.error("Contacts DELETE error:", err);
      return NextResponse.json({ success: false, error: "Failed to delete contact." }, { status: 500 });
    }
  });
}
