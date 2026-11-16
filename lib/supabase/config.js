/**
 * Supabase configuration and environment validation
 */
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  getSupabaseServiceRoleKey,
} from "@/lib/env";

export function getSupabaseConfig() {
  const url = NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const publishableKey =
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return {
    url,
    publishableKey,
    serviceRoleKey,
    isConfigured: Boolean(url && (publishableKey || serviceRoleKey)),
    hasServiceRole: Boolean(url && serviceRoleKey),
  };
}

export function isSupabaseConfigured() {
  const { isConfigured } = getSupabaseConfig();
  return isConfigured;
}
