import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NEXT_PUBLIC_SUPABASE_URL, getSupabaseServiceRoleKey } from "@/lib/env";

let adminClientInstance = null;

/**
 * Returns a privileged, server-only Supabase admin client using the service role key.
 * This client bypasses RLS and must ONLY be used on the server after custom JWT & RBAC verification.
 * NEVER import this file in Client Components or expose the service role key.
 */
export function getAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("CRITICAL SECURITY ERROR: Supabase admin client cannot be invoked from the browser.");
  }

  const serviceRoleKey = getSupabaseServiceRoleKey();
  const url = NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  if (!url || !serviceRoleKey) {
    // If not configured yet, return a dummy mock client that warns rather than crashing during build
    return createSupabaseClient(
      url || "https://placeholder.supabase.co",
      serviceRoleKey || "placeholder-service-role-key",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  if (!adminClientInstance) {
    adminClientInstance = createSupabaseClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClientInstance;
}
