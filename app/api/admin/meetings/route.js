import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { MeetingRepository } from "@/lib/repositories/meeting.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "meetings", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status") || "all";
      const search = searchParams.get("search") || "";

      const result = await MeetingRepository.list({
        status,
        search,
        limit: 100,
      });

      return NextResponse.json({
        success: true,
        meetings: result.meetings,
        total: result.total,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch meetings" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "meetings", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { title, clientName, clientEmail, date, time, durationMinutes, meetingLink, notes } = body;

      if (!title || !clientName || !date || !time) {
        return NextResponse.json(
          { success: false, error: "Title, client name, date, and time are required" },
          { status: 400 }
        );
      }

      const meeting = await MeetingRepository.create({
        title,
        clientName,
        clientEmail: clientEmail || "",
        meetingDate: date,
        meetingTime: time,
        durationMinutes: Number(durationMinutes) || 30,
        meetingLink: meetingLink || "https://calendly.com/team-bytecglobal/30min",
        notes: notes || "",
        status: "confirmed",
        source: "admin",
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "SCHEDULE_MEETING",
        module: "MEETINGS",
        recordId: meeting.id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Scheduled meeting with ${clientName} on ${date} at ${time}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, meeting });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to schedule meeting" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "meetings", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { id, date, time, status, notes, meetingLink } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Meeting ID required" }, { status: 400 });
      }

      const updates = {};
      if (date) updates.date = date;
      if (time) updates.time = time;
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      if (meetingLink) updates.meetingLink = meetingLink;

      const meeting = await MeetingRepository.update(id, updates);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_MEETING",
        module: "MEETINGS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Updated meeting ${id} (Status: ${meeting.status}).`,
        result: "success",
      });

      return NextResponse.json({ success: true, meeting });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to update meeting" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "meetings", async (request, admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Meeting ID required" }, { status: 400 });
      }

      await MeetingRepository.delete(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CANCEL_MEETING",
        module: "MEETINGS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Cancelled meeting ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Meeting cancelled." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to delete meeting" },
        { status: 500 }
      );
    }
  });
}
