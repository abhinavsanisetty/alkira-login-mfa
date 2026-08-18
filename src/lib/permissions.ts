/**
 * Roles are data. `can()` is the only code that reads them, so the whole policy
 * is one testable truth table and adding a role is an edit to this object.
 *
 * Client-side only: this decides what to *show*. A real server re-evaluates the
 * same policy on every mutation.
 */
export const PERMISSIONS = {
  viewer: ["connector:view"],
  editor: ["connector:view", "connector:create", "connector:edit", "connector:delete"],
  admin: [
    "connector:view",
    "connector:create",
    "connector:edit",
    "connector:delete",
    "user:manage",
  ],
} as const;

export type Role = keyof typeof PERMISSIONS;
export type Permission = (typeof PERMISSIONS)[Role][number];

export function can(
  user: { role: Role } | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  return (PERMISSIONS[user.role] as readonly Permission[]).includes(permission);
}
