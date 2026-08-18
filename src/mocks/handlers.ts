import { delay, http, HttpResponse } from "msw";

import type { User } from "@/features/auth/types";
import {
  LOGIN_MAX_ATTEMPTS,
  LOGIN_RATE_WINDOW_MS,
  MOCK_LATENCY_MS,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
} from "@/lib/constants";
import type { ApiErrorCode } from "@/lib/api";
import { connectorSchema, loginSchema, mfaSchema } from "@/lib/schemas";

import { SEED_CONNECTORS, SEED_USERS, type Connector } from "./data";
import { inbox } from "./inbox";

interface ChallengeRecord {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: number;
  attemptsRemaining: number;
}

const challenges = new Map<string, ChallengeRecord>();
const loginAttempts = new Map<string, number[]>();
let connectors: Connector[] = [...SEED_CONNECTORS];

function fail(status: number, code: ApiErrorCode, message: string, extra?: object) {
  return HttpResponse.json({ code, message, ...extra }, { status });
}

function randomCode() {
  return Array.from({ length: OTP_LENGTH }, () => Math.floor(Math.random() * 10)).join("");
}

async function latency() {
  // Real delay in the browser so loading states are designed and visible; none
  // under test, where it would only make the suite slow.
  if (import.meta.env.MODE === "test") return;
  const { min, max } = MOCK_LATENCY_MS;
  await delay(min + Math.random() * (max - min));
}

function issueChallenge(user: (typeof SEED_USERS)[number], id?: string): ChallengeRecord {
  const record: ChallengeRecord = {
    id: id ?? `chg_${Math.random().toString(36).slice(2, 10)}`,
    userId: user.id,
    email: user.email,
    code: randomCode(),
    expiresAt: Date.now() + OTP_TTL_MS,
    // A resend reuses the existing attempt budget. Refilling it would make
    // resend an unlimited brute-force allowance.
    attemptsRemaining: challenges.get(id ?? "")?.attemptsRemaining ?? OTP_MAX_ATTEMPTS,
  };
  challenges.set(record.id, record);
  inbox.deliver(record.email, record.code);
  return record;
}

function publicChallenge(record: ChallengeRecord) {
  return {
    id: record.id,
    email: record.email,
    attemptsRemaining: record.attemptsRemaining,
    expiresAt: record.expiresAt,
  };
}

function toUser({ id, email, name, role }: (typeof SEED_USERS)[number]): User {
  return { id, email, name, role };
}

function rateLimited(email: string) {
  const now = Date.now();
  const recent = (loginAttempts.get(email) ?? []).filter((t) => now - t < LOGIN_RATE_WINDOW_MS);
  loginAttempts.set(email, recent);
  return recent.length >= LOGIN_MAX_ATTEMPTS;
}

function recordAttempt(email: string) {
  loginAttempts.set(email, [...(loginAttempts.get(email) ?? []), Date.now()]);
}

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    await latency();
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail(400, "INVALID_CREDENTIALS", "Enter an email address and password.");
    }

    const email = parsed.data.email.toLowerCase();
    if (rateLimited(email)) {
      return fail(429, "RATE_LIMITED", "Too many attempts. Wait a minute and try again.");
    }

    const user = SEED_USERS.find((u) => u.email === email);
    if (!user) {
      recordAttempt(email);
      return fail(401, "INVALID_CREDENTIALS", "No account with that email.");
    }
    if (user.password !== parsed.data.password) {
      recordAttempt(email);
      return fail(401, "INVALID_CREDENTIALS", "Incorrect password.");
    }

    loginAttempts.delete(email);
    return HttpResponse.json(publicChallenge(issueChallenge(user)));
  }),

  http.post("/api/auth/mfa/verify", async ({ request }) => {
    await latency();
    const body = (await request.json()) as { challengeId?: string; code?: string };
    const record = body.challengeId ? challenges.get(body.challengeId) : undefined;

    if (!record) {
      return fail(401, "OTP_EXPIRED", "That challenge is no longer valid. Sign in again.");
    }
    if (Date.now() > record.expiresAt) {
      challenges.delete(record.id);
      return fail(401, "OTP_EXPIRED", "That code has expired. Sign in again.", {
        attemptsRemaining: 0,
      });
    }

    const parsed = mfaSchema.safeParse(body);
    const submitted = parsed.success ? parsed.data.code : "";

    if (submitted !== record.code) {
      record.attemptsRemaining -= 1;
      if (record.attemptsRemaining <= 0) {
        challenges.delete(record.id);
        return fail(401, "TOO_MANY_ATTEMPTS", "Too many incorrect codes. Sign in again.", {
          attemptsRemaining: 0,
        });
      }
      const left = record.attemptsRemaining;
      return fail(
        401,
        "OTP_INVALID",
        `That code is not correct. ${left} attempt${left === 1 ? "" : "s"} remaining.`,
        { attemptsRemaining: left },
      );
    }

    const user = SEED_USERS.find((u) => u.id === record.userId);
    challenges.delete(record.id);
    inbox.clear();
    if (!user) return fail(401, "INVALID_CREDENTIALS", "Account not found.");
    return HttpResponse.json(toUser(user));
  }),

  http.post("/api/auth/mfa/resend", async ({ request }) => {
    await latency();
    const body = (await request.json()) as { challengeId?: string };
    const record = body.challengeId ? challenges.get(body.challengeId) : undefined;
    if (!record) {
      return fail(401, "OTP_EXPIRED", "That challenge is no longer valid. Sign in again.");
    }
    const user = SEED_USERS.find((u) => u.id === record.userId);
    if (!user) return fail(401, "INVALID_CREDENTIALS", "Account not found.");
    return HttpResponse.json(publicChallenge(issueChallenge(user, record.id)));
  }),

  http.get("/api/connectors", async () => {
    await latency();
    return HttpResponse.json(connectors);
  }),

  http.post("/api/connectors", async ({ request }) => {
    await latency();
    const body = (await request.json()) as Omit<Connector, "id" | "status" | "owners"> &
      Partial<Pick<Connector, "owners">>;
    const created: Connector = {
      ...body,
      // A new connector starts owned by whoever created it. The client sends the
      // name because there is no session on this side of the boundary; a real
      // API would read it from the authenticated principal and ignore the body.
      owners: body.owners ?? [],
      id: `cx_${Math.random().toString(36).slice(2, 8)}`,
      status: "provisioning",
    };
    connectors = [created, ...connectors];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch("/api/connectors/:id", async ({ params, request }) => {
    await latency();

    const parsed = connectorSchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail(400, "VALIDATION", parsed.error.issues[0]?.message ?? "That name is not valid.");
    }

    const target = connectors.find((c) => c.id === params.id);
    if (!target) return fail(404, "NOT_FOUND", "That connector no longer exists.");

    // Names identify a connector to an operator, so a duplicate is a real
    // conflict rather than a cosmetic one. 409 is the honest status for it.
    const taken = connectors.some((c) => c.id !== params.id && c.name === parsed.data.name);
    if (taken) return fail(409, "CONFLICT", "A connector with that name already exists.");

    const updated: Connector = { ...target, name: parsed.data.name };
    connectors = connectors.map((c) => (c.id === updated.id ? updated : c));
    return HttpResponse.json(updated);
  }),

  http.delete("/api/connectors/:id", async ({ params }) => {
    await latency();
    connectors = connectors.filter((c) => c.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];

/** Test-only reset so suites do not leak challenges or rate-limit counters. */
export function resetMockState() {
  challenges.clear();
  loginAttempts.clear();
  connectors = [...SEED_CONNECTORS];
  inbox.clear();
}
