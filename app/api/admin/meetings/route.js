import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "meetings", async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const db = getDb();
    let meetings = [...(db.meetings || [])];

    if (status !== "all") {
      meetings = meetings.filter((m) => m.status === status);
    }

    return NextResponse.json({
      success: true,
      meetings,
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "meetings", async () => {
    const body = await req.json().catch(() => ({}));
    const { title, clientName, clientEmail, date, time, durationMinutes, meetingLink, notes } = body;

    if (!title || !clientName || !date || !time) {
      return NextResponse.json({ success: false, error: "Title, client name, date, and time are required" }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const newMeeting = {
      id: `mtg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      clientName,
      clientEmail: clientEmail || "",
      date,
      time,
      durationMinutes: Number(durationMinutes) || 30,
      meetingLink: meetingLink || "https://calendly.com/team-bytecglobal/30min",
      notes: notes || "",
      status: "confirmed",
      source: "admin",
      createdAt: now,
      updatedAt: now,
    };

    if (!db.meetings) db.meetings = [];
    db.meetings.unshift(newMeeting);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "SCHEDULE_MEETING",
      module: "MEETINGS",
      recordId: newMeeting.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Scheduled meeting with ${clientName} on ${date} at ${time}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, meeting: newMeeting });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "meetings", async () => {
    const body = await req.json().catch(() => ({}));
    const { id, date, time, status, notes, meetingLink } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Meeting ID required" }, { status: 400 });
    }

    const db = getDb();
    const meeting = (db.meetings || []).find((m) => m.id === id);

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    if (date) meeting.date = date;
    if (time) meeting.time = time;
    if (status) meeting.status = status;
    if (notes !== undefined) meeting.notes = notes;
    if (meetingLink) meeting.meetingLink = meetingLink;
    meeting.updatedAt = new Date().toISOString();

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_MEETING",
      module: "MEETINGS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated meeting ${id} (Status: ${meeting.status}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, meeting });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "meetings", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Meeting ID required" }, { status: 400 });
    }

    const db = getDb();
    db.meetings = (db.meetings || []).filter((m) => m.id !== id);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CANCEL_MEETING",
      module: "MEETINGS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Cancelled meeting ${id}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Meeting cancelled." });
  });
}
