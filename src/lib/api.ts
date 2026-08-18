import type { AuthError, Challenge, User } from "@/features/auth";
import type { Connector } from "@/mocks/data";
import type { LoginInput } from "@/lib/schemas";

/** Carries the server's error body. `attemptsRemaining` is present only on MFA
 *  failures, where the reducer needs it to decide whether the challenge dies. */
export class ApiError extends Error {
  readonly detail: AuthError;
  readonly attemptsRemaining?: number;

  constructor(detail: AuthError, attemptsRemaining?: number) {
    super(detail.message);
    this.name = "ApiError";
    this.detail = detail;
    this.attemptsRemaining = attemptsRemaining;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    });
  } catch {
    throw new ApiError({ code: "NETWORK", message: "Could not reach the server." });
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | (AuthError & { attemptsRemaining?: number })
      | null;
    throw new ApiError(
      body ?? { code: "NETWORK", message: "Something went wrong." },
      body?.attemptsRemaining,
    );
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

const post = <T>(url: string, body: unknown) =>
  request<T>(url, { method: "POST", body: JSON.stringify(body) });

export const authApi = {
  login: (input: LoginInput) => post<Challenge>("/api/auth/login", input),
  verify: (challengeId: string, code: string) =>
    post<User>("/api/auth/mfa/verify", { challengeId, code }),
  resend: (challengeId: string) => post<Challenge>("/api/auth/mfa/resend", { challengeId }),
};

export const connectorsApi = {
  list: () => request<Connector[]>("/api/connectors"),
  create: (input: Pick<Connector, "name" | "type" | "region" | "owners">) =>
    post<Connector>("/api/connectors", input),
  remove: (id: string) => request<void>(`/api/connectors/${id}`, { method: "DELETE" }),
};
