import { getAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "bytecglobal-media";
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "application/pdf",
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export const MediaRepository = {
  async upload({ fileBuffer, originalName, mimeType, sizeBytes, category = "general", altText = "", uploadedBy }) {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`Unsupported media format: ${mimeType}. Allowed: JPG, PNG, WebP, SVG, GIF, PDF.`);
    }

    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error("File exceeds maximum allowed upload size (10MB).");
    }

    const supabase = getAdminClient();
    const cleanExt = originalName.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
    const storagePath = `${category}/${uniqueFileName}`;

    // Upload to Supabase Storage Bucket
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    // Generate public URL
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    const publicUrl = publicUrlData?.publicUrl || `/uploads/${uniqueFileName}`;

    // Insert metadata into media PostgreSQL table
    const { data: mediaRow, error: dbError } = await supabase
      .from("media")
      .insert({
        filename: uniqueFileName,
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        storage_path: storagePath,
        public_url: publicUrl,
        category,
        alt_text: altText,
        uploaded_by: uploadedBy || null,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup storage file if db insertion fails
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      throw new Error(`Media metadata record failed: ${dbError.message}`);
    }

    return {
      id: mediaRow.id,
      filename: mediaRow.filename,
      originalName: mediaRow.original_name,
      mimeType: mediaRow.mime_type,
      size: Number(mediaRow.size_bytes),
      path: mediaRow.public_url,
      category: mediaRow.category,
      altText: mediaRow.alt_text,
      createdAt: mediaRow.created_at,
    };
  },

  async delete(id) {
    const supabase = getAdminClient();
    const { data: mediaRow, error: fetchErr } = await supabase
      .from("media")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !mediaRow) {
      throw new Error("Media asset not found.");
    }

    // Delete from Supabase Storage
    if (mediaRow.storage_path) {
      await supabase.storage.from(BUCKET_NAME).remove([mediaRow.storage_path]);
    }

    // Delete row from media table
    const { error: deleteErr } = await supabase.from("media").delete().eq("id", id);
    if (deleteErr) throw new Error(deleteErr.message);

    return true;
  },

  async list({ page = 1, limit = 50, category, search } = {}) {
    const supabase = getAdminClient();
    let query = supabase.from("media").select("*", { count: "exact" });

    if (category && category !== "all") query = query.eq("category", category);
    if (search) {
      query = query.or(`original_name.ilike.%${search}%,alt_text.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      media: (data || []).map((m) => ({
        id: m.id,
        filename: m.filename,
        originalName: m.original_name,
        mimeType: m.mime_type,
        size: Number(m.size_bytes),
        path: m.public_url,
        category: m.category,
        altText: m.alt_text,
        createdAt: m.created_at,
      })),
      total: count || 0,
      page,
      limit,
    };
  },

  async findById(id) {
    if (!id) return null;
    const supabase = getAdminClient();
    const { data, error } = await supabase.from("media").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;

    return {
      id: data.id,
      filename: data.filename,
      originalName: data.original_name,
      mimeType: data.mime_type,
      size: Number(data.size_bytes),
      path: data.public_url,
      category: data.category,
      altText: data.alt_text,
      createdAt: data.created_at,
    };
  },
};
