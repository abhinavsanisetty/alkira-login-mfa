import { describe, expect, it } from "vitest";

import { can, type Permission, type Role } from "./permissions";

const ALL_PERMISSIONS: readonly Permission[] = [
  "connector:view",
  "connector:create",
  "connector:edit",
  "connector:delete",
  "user:manage",
];

// Stated independently of PERMISSIONS so an accidental edit to the policy fails
// here rather than passing tautologically.
const GRANTED: Record<Role, readonly Permission[]> = {
  viewer: ["connector:view"],
  editor: ["connector:view", "connector:create", "connector:edit", "connector:delete"],
  admin: ALL_PERMISSIONS,
};

describe("can", () => {
  for (const role of Object.keys(GRANTED) as Role[]) {
    for (const permission of ALL_PERMISSIONS) {
      const expected = GRANTED[role].includes(permission);
      it(`${role} ${expected ? "can" : "cannot"} ${permission}`, () => {
        expect(can({ role }, permission)).toBe(expected);
      });
    }
  }

  it("denies everything without a user", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(can(null, permission)).toBe(false);
      expect(can(undefined, permission)).toBe(false);
    }
  });
});
