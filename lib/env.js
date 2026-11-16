/**
 * Environment configuration helper with safe fallbacks and secret protection.
 * Server-only secrets are never exported or leaked to client bundles.
 */

// Safe public site URL
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://bytecglobal.com";

// Sanitized WhatsApp number (numbers only)
const rawWhatsapp =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || "";
export const WHATSAPP_NUMBER = rawWhatsapp.replace(/\D/g, "");

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
