/**
 * Environment configuration helper with safe fallbacks and secret protection.
 * Server-only secrets are never exported or leaked to client bundles.
 */

// Safe public site URL
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://bytecglobal.com";

// Public Supabase configuration
export const NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// Server-side inquiry recipient
export function getContactRecipientEmail() {
  return process.env.CONTACT_RECIPIENT_EMAIL || "inquiries@bytecglobal.com";
}

// Server-side Resend API key
export function getResendApiKey() {
  return process.env.RESEND_API_KEY || "";
}

// Server-side Admin Session JWT Secret
export function getAdminJwtSecret() {
  return process.env.ADMIN_JWT_SECRET || "bytec_enterprise_super_secure_jwt_secret_token_2026_xyz";
}

// Server-side Supabase Service Role Key
export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

// Initial Admin Credentials (used only during first-time database seed / init)
export function getInitialAdminCredentials() {
  return {
    email: process.env.INITIAL_ADMIN_EMAIL || "admin@bytecglobal.com",
    password: process.env.INITIAL_ADMIN_PASSWORD || "",
  };
}
