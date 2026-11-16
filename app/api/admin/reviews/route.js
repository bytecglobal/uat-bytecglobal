import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { SettingsRepository } from "@/lib/repositories/settings.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "reviews", async () => {
    try {
      const testimonials = await SettingsRepository.listTestimonials();
      return NextResponse.json({
        success: true,
        testimonials,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch testimonials" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "reviews", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { clientName, companyName, designation, reviewText, rating, featured } = body;

      if (!clientName || !reviewText) {
        return NextResponse.json(
          { success: false, error: "Client name and review text required" },
          { status: 400 }
        );
      }

      const review = await SettingsRepository.createTestimonial({
        clientName,
        companyName: companyName || "",
        designation: designation || "",
        reviewText,
        rating: Number(rating) || 5,
        featured: Boolean(featured),
        status: "published",
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "CREATE_REVIEW",
        module: "REVIEWS",
        recordId: review.id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Created review for ${clientName}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, testimonial: review });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to create review" },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req) {
  return withAdminAuth(req, "reviews", async (request, admin) => {
    try {
      const body = await request.json().catch(() => ({}));
      const { id, clientName, companyName, designation, reviewText, rating, featured, status } = body;

      if (!id) {
        return NextResponse.json({ success: false, error: "Review ID required" }, { status: 400 });
      }

      const updates = {};
      if (clientName !== undefined) updates.clientName = clientName;
      if (companyName !== undefined) updates.companyName = companyName;
      if (designation !== undefined) updates.designation = designation;
      if (reviewText !== undefined) updates.reviewText = reviewText;
      if (rating !== undefined) updates.rating = Number(rating);
      if (featured !== undefined) updates.featured = Boolean(featured);
      if (status !== undefined) updates.status = status;

      const review = await SettingsRepository.updateTestimonial(id, updates);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPDATE_REVIEW",
        module: "REVIEWS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Updated review ${id} (Status: ${status || review.status}).`,
        result: "success",
      });

      return NextResponse.json({ success: true, testimonial: review });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to update review" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "reviews", async (request, admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Review ID required" }, { status: 400 });
      }

      await SettingsRepository.deleteTestimonial(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "DELETE_REVIEW",
        module: "REVIEWS",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Deleted review ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Review deleted." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to delete review" },
        { status: 500 }
      );
    }
  });
}
