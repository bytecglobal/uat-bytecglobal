import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/guard";
import { getDb, saveDb } from "@/lib/db";
import { recordAuditLogSync } from "@/lib/auth/session";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "application/pdf",
];
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

export async function GET(req) {
  return withAdminAuth(req, "media", async () => {
    const db = getDb();
    return NextResponse.json({
      success: true,
      media: db.media || [],
    });
  });
}

export async function POST(req, admin) {
  return withAdminAuth(req, "media", async () => {
    try {
      const formData = await req.formData();
      const file = formData.get("file");
      const category = formData.get("category") || "general";
      const altText = formData.get("altText") || "";

      if (!file || typeof file === "string") {
        return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        return NextResponse.json({ success: false, error: "File exceeds 5MB size limit." }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, error: "Unsupported file type." }, { status: 400 });
      }

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const originalName = file.name || "upload";
      const ext = path.extname(originalName) || ".png";
      const sanitizedName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadsDir, sanitizedName);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      const db = getDb();
      const mediaItem = {
        id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        filename: sanitizedName,
        originalName,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/${sanitizedName}`,
        category,
        altText,
        uploadedBy: admin.name || admin.email,
        createdAt: new Date().toISOString(),
      };

      if (!db.media) db.media = [];
      db.media.unshift(mediaItem);

      recordAuditLogSync({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "UPLOAD_MEDIA",
        module: "MEDIA",
        recordId: mediaItem.id,
        ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
        details: `Uploaded ${sanitizedName} (${file.size} bytes).`,
        result: "success",
      });

      await saveDb(db);
      return NextResponse.json({ success: true, media: mediaItem });
    } catch (err) {
      console.error("Media upload error:", err);
      return NextResponse.json({ success: false, error: "Upload failed." }, { status: 500 });
    }
  });
}

export async function DELETE(req, admin) {
  return withAdminAuth(req, "media", async () => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Media ID required" }, { status: 400 });
    }

    const db = getDb();
    const item = (db.media || []).find((m) => m.id === id);

    if (item && item.filename) {
      try {
        const fullPath = path.join(process.cwd(), "public", "uploads", item.filename);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (e) {
        console.error("Error removing file from disk:", e);
      }
    }

    db.media = (db.media || []).filter((m) => m.id !== id);

    recordAuditLogSync({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELETE_MEDIA",
      module: "MEDIA",
      recordId: id,
      ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
      details: `Deleted media file ${item?.filename || id}.`,
      result: "success",
    });

    await saveDb(db);
    return NextResponse.json({ success: true, message: "Media deleted." });
  });
}
