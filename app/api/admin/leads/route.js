import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { LeadRepository } from "@/lib/repositories/lead.repository";
import { ClientRepository } from "@/lib/repositories/client.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "leads", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const stage = searchParams.get("stage") || "all";
      const search = searchParams.get("search") || "";

      const result = await LeadRepository.list({
        stage,
        search,
        limit: 200,
      });

      return NextResponse.json({
        success: true,
        leads: result.leads,
        total: result.total,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch leads" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "leads", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { action, leadId, name, email, companyName, service, stage, estimatedValue } = body;

      // Convert lead to client
      if (action === "convert_to_client" && leadId) {
        const lead = await LeadRepository.findById(leadId);
        if (!lead) {
          return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
        }

        const updatedLead = await LeadRepository.update(leadId, { stage: "won" });

        const newClient = await ClientRepository.create({
          name: lead.companyName || lead.name,
          contactPerson: lead.name,
          email: lead.email,
          industry: lead.service || "Enterprise",
          status: "active",
          totalValue: Number(lead.estimatedValue) || 20000,
          notes: `Converted from lead ${lead.id}. Interested in ${lead.service}.`,
        });

        recordAuditLogSync({
          adminId: admin.id,
          adminEmail: admin.email,
          action: "CONVERT_LEAD_TO_CLIENT",
          module: "LEADS",
          recordId: leadId,
          ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
          details: `Converted lead ${leadId} into client ${newClient.id}.`,
          result: "success",
        });

        return NextResponse.json({ success: true, client: newClient, lead: updatedLead });
      }

      // Manual lead creation
      if (!name || !email) {
        return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
      }

      const newLead = await LeadRepository.create({
        name,
        email,
        companyName: companyName || "",
        service: service || "General Software Services",
        stage: stage || "new",
        estimatedValue: Number(estimatedValue) || 10000,
        source: "Admin Created",
        assignedTo: admin.id,
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CREATE_LEAD",
        module: "LEADS",
        recordId: newLead.id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Created new lead ${newLead.id} for ${email}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, lead: newLead });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to process lead request" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "leads", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { id, stage, estimatedValue, noteText } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Lead ID required" }, { status: 400 });
      }

      const updates = {};
      if (stage !== undefined) updates.stage = stage;
      if (estimatedValue !== undefined) updates.estimatedValue = Number(estimatedValue);

      let lead = await LeadRepository.update(id, updates);

      if (noteText) {
        lead = await LeadRepository.addNote(id, noteText, admin.name || admin.email);
      }

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_LEAD",
        module: "LEADS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Updated lead ${id} (Stage: ${stage || lead.stage}).`,
        result: "success",
      });

      return NextResponse.json({ success: true, lead });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to update lead" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "leads", async (request, admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Lead ID required" }, { status: 400 });
      }

      await LeadRepository.delete(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "DELETE_LEAD",
        module: "LEADS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Deleted lead ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Lead deleted." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to delete lead" },
        { status: 500 }
      );
    }
  });
}
