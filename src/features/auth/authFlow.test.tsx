import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "@/app/App";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { inbox } from "@/mocks/inbox";

/**
 * Integration coverage for the flow the brief describes. These drive the real
 * components through the real fetch path — MSW answers in Node with the same
 * handlers the browser uses — so what is exercised here is what ships.
 */

function renderApp(route = "/login") {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    ),
  };
}

async function signIn(user: UserEvent, email: string) {
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/password/i), "Password123!");
  await user.click(screen.getByRole("button", { name: /continue/i }));
  await screen.findByRole("heading", { name: /check your email/i });
}

/** The code only exists on the mock's side of the boundary, which is the point
 *  of the inbox: the test reads it the way a person reads their email. */
function currentCode(): string {
  const message = inbox.snapshot().find((m) => !m.superseded);
  if (!message) throw new Error("No code was delivered");
  return message.code;
}

async function completeMfa(user: UserEvent) {
  await user.type(screen.getByLabelText(/verification code/i), currentCode());
  await user.click(screen.getByRole("button", { name: /^verify$/i }));
  await screen.findByRole("heading", { name: /cloud connectors/i });
  // The heading renders before the table data lands; wait for a real row so
  // assertions do not run against skeletons.
  await screen.findByText("prod-us-west");
}

async function submitCode(user: UserEvent, code: string) {
  const field = screen.getByLabelText(/verification code/i);
  await user.clear(field);
  await user.type(field, code);
  await user.click(screen.getByRole("button", { name: /^verify$/i }));
}

describe("login and MFA", () => {
  it("blocks submission when the email is not valid", async () => {
    const { user } = renderApp();
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /check your email/i })).not.toBeInTheDocument();
  });

  it("reports an unknown account without advancing", async () => {
    const { user } = renderApp();
    await user.type(screen.getByLabelText(/email/i), "nobody@alkira.com");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByText(/no account with that email/i)).toBeInTheDocument();
  });

  it("advances to the challenge and authenticates with the delivered code", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);

    expect(screen.getByRole("heading", { name: /cloud connectors/i })).toBeInTheDocument();
  });

  it("decrements attempts on a wrong code and keeps the challenge alive", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    await submitCode(user, "000000");

    expect(await screen.findByRole("alert")).toHaveTextContent(/2 attempts remaining/i);
    expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument();
  });

  it("destroys the challenge after three wrong codes and returns to sign in", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");

    await submitCode(user, "000000");
    await waitFor(async () =>
      expect(await screen.findByRole("alert")).toHaveTextContent(/2 attempts/i),
    );
    await submitCode(user, "000000");
    await waitFor(async () =>
      expect(await screen.findByRole("alert")).toHaveTextContent(/1 attempt /i),
    );
    await submitCode(user, "000000");

    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/too many incorrect codes/i);
  });

  it("supersedes the previous code on resend", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    const first = currentCode();

    await user.click(screen.getByRole("button", { name: /resend code/i }));
    await waitFor(() => expect(currentCode()).not.toBe(first));

    await user.type(screen.getByLabelText(/verification code/i), first);
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    expect(await screen.findByText(/that code is not correct/i)).toBeInTheDocument();
  });
});

describe("route protection", () => {
  it("redirects an anonymous visitor away from a protected route", async () => {
    renderApp("/connectors");
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  // The test that proves the second factor is not decorative: password verified,
  // challenge live, and /connectors is still refused.
  it("refuses a protected route to a password-verified but pre-MFA visitor", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");

    renderApp("/connectors");
    expect(await screen.findAllByRole("heading", { name: /sign in/i })).not.toHaveLength(0);
  });

  it("redirects an anonymous visitor away from the MFA screen", async () => {
    renderApp("/mfa");
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });
});

describe("role-based access control", () => {
  it("hides every edit action from a read-only role", async () => {
    const { user } = renderApp();
    await signIn(user, "viewer@alkira.com");
    await completeMfa(user);

    expect(screen.getByText(/read-only access/i)).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /actions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new connector/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("shows create, edit, and delete to a read/write role", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);

    expect(screen.getByRole("columnheader", { name: /actions/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new connector/i })).toBeInTheDocument();

    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(within(rows[1] as HTMLElement).getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(
      within(rows[1] as HTMLElement).getByRole("button", { name: /delete/i }),
    ).toBeInTheDocument();
  });

  it("deletes a connector for a role that may", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);

    const before = within(screen.getByRole("table")).getAllByRole("row").length;
    await user.click(within(screen.getByRole("table")).getAllByRole("button", { name: /delete/i })[0]!);

    await waitFor(() =>
      expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(before - 1),
    );
  });
});
