/**
 * RBAC Role and Permission Definitions for BytecGlobal Admin Panel
 */

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  MANAGER: "MANAGER",
};

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "overview",
    "visitors",
    "analytics",
    "contacts",
    "leads",
    "clients",
    "projects",
    "meetings",
    "reviews",
    "emails",
    "automations",
    "templates",
    "notifications",
    "newsletter",
    "cms",
    "seo",
    "media",
    "backups",
  ],
  EDITOR: [
    "overview",
    "cms",
    "seo",
    "media",
    "reviews",
    "notifications",
  ],
  MANAGER: [
    "overview",
    "contacts",
    "leads",
    "clients",
    "meetings",
    "projects",
    "reviews",
    "notifications",
  ],
};

/**
 * Checks if a role has permission to access a specific admin module
 */
export function canAccessModule(role, moduleName) {
  if (!role) return false;
  if (role === ROLES.SUPER_ADMIN) return true;
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(moduleName);
}
