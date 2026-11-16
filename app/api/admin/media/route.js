import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { MediaRepository } from "@/lib/repositories/media.repository";
import { recordAuditLogSync } from "@/lib/auth/session";

export async function GET(req) {
  return withAdminAuth(req, "media", async () => {
    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get("category") || "all";
      const search = searchParams.get("search") || "";

      const result = await MediaRepository.list({
        category,
        search,
        limit: 100,
      });

      return NextResponse.json({
        success: true,
        media: result.media,
        total: result.total,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to fetch media assets" },
        { status: 500 }
      );
    }
  });
}

export async function POST(req) {
  return withAdminAuth(req, "media", async (request, admin) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      const category = formData.get("category") || "general";
      const altText = formData.get("altText") || "";

      if (!file || typeof file === "string") {
        return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const mediaItem = await MediaRepository.upload({
        fileBuffer,
        originalName: file.name || "upload",
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        category,
        altText,
        uploadedBy: admin.id,
      });

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPLOAD_MEDIA",
        module: "MEDIA",
        recordId: mediaItem.id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Uploaded ${mediaItem.originalName} (${file.size} bytes) to Supabase Storage.`,
        result: "success",
      });

      return NextResponse.json({ success: true, media: mediaItem });
    } catch (err) {
      console.error("Media upload error:", err);
      return NextResponse.json(
        { success: false, error: err.message || "Upload failed." },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req) {
  return withAdminAuth(req, "media", async (request, admin) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ success: false, error: "Media ID required" }, { status: 400 });
      }

      await MediaRepository.delete(id);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "DELETE_MEDIA",
        module: "MEDIA",
        recordId: id,
        ip: request.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Deleted media file ${id}.`,
        result: "success",
      });

      return NextResponse.json({ success: true, message: "Media deleted." });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err.message || "Failed to delete media" },
        { status: 500 }
      );
    }
  });
}
