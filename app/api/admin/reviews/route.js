import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "reviews", async () => {
    const db = getDb();
    return NextResponse.json({
      success: true,
      testimonials: db.testimonials || [],
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "reviews", async () => {
    const body = await req.json().catch(() => ({}));
    const { clientName, companyName, designation, reviewText, rating, featured } = body;

    if (!clientName || !reviewText) {
      return NextResponse.json({ success: false, error: "Client name and review text required" }, { status: 400 });
    }

    const db = getDb();
    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientName,
      companyName: companyName || "",
      designation: designation || "",
      reviewText,
      rating: Number(rating) || 5,
      clientImage: null,
      featured: Boolean(featured),
      status: "published",
      createdAt: new Date().toISOString(),
    };

    if (!db.testimonials) db.testimonials = [];
    db.testimonials.unshift(newReview);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CREATE_REVIEW",
      module: "REVIEWS",
      recordId: newReview.id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Created review for ${clientName}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, testimonial: newReview });
  });
}

export async function PATCH(req, admin) {
  return withAdminAuth(req, "reviews", async () => {
    const body = await req.json().catch(() => ({}));
    const { id, clientName, companyName, designation, reviewText, rating, featured, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Review ID required" }, { status: 400 });
    }

    const db = getDb();
    const review = (db.testimonials || []).find((r) => r.id === id);

    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
    }

    if (clientName) review.clientName = clientName;
    if (companyName !== undefined) review.companyName = companyName;
    if (designation !== undefined) review.designation = designation;
    if (reviewText) review.reviewText = reviewText;
    if (rating !== undefined) review.rating = Number(rating);
    if (featured !== undefined) review.featured = Boolean(featured);
    if (status) review.status = status;

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_REVIEW",
      module: "REVIEWS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Updated review for ${review.clientName} (Status: ${review.status}).`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, testimonial: review });
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "reviews", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Review ID required" }, { status: 400 });
    }

    const db = getDb();
    db.testimonials = (db.testimonials || []).filter((r) => r.id !== id);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELETE_REVIEW",
      module: "REVIEWS",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Deleted review ${id}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Review deleted." });
  });
}
