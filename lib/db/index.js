/**
 * DEPRECATED: BytecGlobal JSON Database Adapter
 *
 * This file is retained solely as a backward-compatibility stub.
 * All application operations have migrated to Supabase PostgreSQL repositories:
 * - Admin operations: @/lib/repositories/admin.repository
 * - Contact operations: @/lib/repositories/contact.repository
 * - Lead operations: @/lib/repositories/lead.repository
 * - Client operations: @/lib/repositories/client.repository
 * - Project operations: @/lib/repositories/project.repository
 * - Meeting operations: @/lib/repositories/meeting.repository
 * - CMS operations: @/lib/repositories/cms.repository
 * - Analytics operations: @/lib/repositories/analytics.repository
 * - Notification operations: @/lib/repositories/notification.repository
 * - Settings operations: @/lib/repositories/settings.repository
 * - Media storage: @/lib/repositories/media.repository
 */

export function getDb() {
  throw new Error(
    "BytecGlobal JSON file database has been permanently decommissioned. Use Supabase repositories from @/lib/repositories/ instead."
  );
}

export async function saveDb() {
  throw new Error(
    "BytecGlobal JSON file database has been permanently decommissioned. Use Supabase repositories from @/lib/repositories/ instead."
  );
}
