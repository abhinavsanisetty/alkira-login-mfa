import type { User } from "@/features/auth";
import type { Connector } from "@/features/connectors";

/** Seeded accounts. Passwords live here because there is no backend; in
 *  production these are Argon2id hashes the client never sees. */
export interface SeedUser extends User {
  password: string;
}

export const SEED_USERS: readonly SeedUser[] = [
  {
    id: "usr_viewer",
    email: "viewer@alkira.com",
    name: "Val Viewer",
    role: "viewer",
    password: "Password123!",
  },
  {
    id: "usr_editor",
    email: "editor@alkira.com",
    name: "Eddie Editor",
    role: "editor",
    password: "Password123!",
  },
  {
    id: "usr_admin",
    email: "admin@alkira.com",
    name: "Adah Admin",
    role: "admin",
    password: "Password123!",
  },
];

export const SEED_CONNECTORS: readonly Connector[] = [
  {
    id: "cx_1",
    name: "prod-us-west",
    type: "AWS",
    region: "us-west-2",
    status: "connected",
    owners: ["Adah Admin", "Eddie Editor", "Priya Nair", "Tom Okafor"],
  },
  {
    id: "cx_2",
    name: "prod-eu-central",
    type: "Azure",
    region: "westeurope",
    status: "connected",
    owners: ["Eddie Editor", "Lena Brandt"],
  },
  {
    id: "cx_3",
    name: "analytics-warehouse",
    type: "GCP",
    region: "us-central1",
    status: "degraded",
    owners: ["Priya Nair"],
  },
  {
    id: "cx_4",
    name: "staging-us-east",
    type: "AWS",
    region: "us-east-1",
    status: "provisioning",
    owners: ["Eddie Editor", "Tom Okafor", "Adah Admin"],
  },
  {
    id: "cx_5",
    name: "partner-transit",
    type: "Azure",
    region: "eastus2",
    status: "connected",
    owners: ["Lena Brandt", "Adah Admin"],
  },
];
