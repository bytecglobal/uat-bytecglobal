import { createBrowserClient } from "@supabase/ssr";
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

let browserClient = null;

/**
 * Creates or reuses a Supabase client for browser (Client Components)
 * Using only public publishable / anon key.
 */
export function createClient() {
  if (typeof window === "undefined") {
    // Return lightweight instance if called during SSR
    return createBrowserClient(
      NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder"
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder"
    );
  }

  return browserClient;
}
