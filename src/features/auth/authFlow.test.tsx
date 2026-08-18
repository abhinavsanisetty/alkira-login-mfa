import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { App } from "@/app/App";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { inbox } from "@/mocks/inbox";

/**
 * Integration coverage for the flow the brief describes. These drive the real
 * components through the real fetch path — MSW answers in Node with the same
 * handlers the browser uses — so what is exercised here is what ships.
 *
 * Each renderApp call builds its own AuthProvider, so a second call is a fresh
 * tree rehydrating from sessionStorage — which is exactly a page reload, and is
 * used deliberately as one below. Navigating *within* one session must go
 * through the test-only link, or the assertion is about a different visitor.
 */

function renderApp(route = "/login") {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <App />
          <Link to="/connectors" data-testid="goto-connectors">
            test-nav
          </Link>
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

  // The test that proves the second factor is not decorative: the password is
  // verified and a challenge is live, and /connectors is *still* refused. The
  // navigation happens inside the same provider, so this is the same visitor
  // mid-challenge rather than a fresh anonymous one.
  it("refuses a protected route to a password-verified but pre-MFA visitor", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");

    await user.click(screen.getByTestId("goto-connectors"));

    expect(await screen.findByRole("heading", { name: /check your email/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /cloud connectors/i })).not.toBeInTheDocument();
  });

  it("redirects an anonymous visitor away from the MFA screen", async () => {
    renderApp("/mfa");
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });
});

describe("session persistence", () => {
  it("keeps an authenticated session across a reload", async () => {
    const { user, unmount } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);
    unmount();

    renderApp("/connectors");
    expect(await screen.findByRole("heading", { name: /cloud connectors/i })).toBeInTheDocument();
  });

  // Without this, signing out leaves the session in storage and the next reload
  // silently signs you back in.
  it("clears the stored session on sign out", async () => {
    const { user, unmount } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);

    await user.click(screen.getByRole("button", { name: /sign out/i }));
    await screen.findByRole("heading", { name: /sign in/i });
    unmount();

    renderApp("/connectors");
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /cloud connectors/i })).not.toBeInTheDocument();
  });

  // A half-completed authentication surviving a refresh is the thing a second
  // factor exists to prevent, so the challenge is deliberately never persisted.
  it("returns a mid-challenge visitor to sign in after a reload", async () => {
    const { user, unmount } = renderApp();
    await signIn(user, "editor@alkira.com");
    unmount();

    renderApp("/mfa");
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /check your email/i })).not.toBeInTheDocument();
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

describe("connector selection", () => {
  // Selection is marked by a left edge rather than a filled row, which is a
  // purely visual device and untestable here (styles are not loaded). What is
  // worth asserting is the state the mark is derived from, and that it is
  // exposed through a real control rather than a click handler on a row.
  it("selects one connector at a time and toggles it off", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);

    const first = screen.getByRole("button", { name: "prod-us-west" });
    const second = screen.getByRole("button", { name: "prod-eu-central" });
    expect(first).toHaveAttribute("aria-pressed", "false");

    await user.click(first);
    expect(first).toHaveAttribute("aria-pressed", "true");

    await user.click(second);
    expect(second).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveAttribute("aria-pressed", "false");

    await user.click(second);
    expect(second).toHaveAttribute("aria-pressed", "false");
  });

  it("offers the add owner control only to a role that may edit", async () => {
    const { user, unmount } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);
    expect(screen.getAllByRole("button", { name: /add owner to/i }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /sign out/i }));
    unmount();

    const second = renderApp();
    await signIn(second.user, "viewer@alkira.com");
    await completeMfa(second.user);
    expect(screen.queryByRole("button", { name: /add owner to/i })).not.toBeInTheDocument();
  });
});

describe("sign up", () => {
  async function gotoSignUp(user: UserEvent) {
    await user.click(screen.getByRole("link", { name: /sign up/i }));
    await screen.findByRole("heading", { name: /create an account/i });
  }

  it("reports every invalid field rather than submitting", async () => {
    const { user } = renderApp();
    await gotoSignUp(user);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.queryByText(/validation passed/i)).not.toBeInTheDocument();
  });

  it("rejects a confirmation that does not match", async () => {
    const { user } = renderApp();
    await gotoSignUp(user);

    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email/i), "ada@alkira.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password123!");
    await user.type(screen.getByLabelText(/confirm password/i), "Password456!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("confirms validation passed without claiming an account was created", async () => {
    const { user } = renderApp();
    await gotoSignUp(user);

    await user.type(screen.getByLabelText(/name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/email/i), "ada@alkira.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password123!");
    await user.type(screen.getByLabelText(/confirm password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/validation passed/i);
    expect(alert).toHaveTextContent(/no account was created/i);
  });
});

describe("renaming a connector", () => {
  async function openRename(user: UserEvent, row = 1) {
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    await user.click(within(rows[row] as HTMLElement).getByRole("button", { name: /edit/i }));
    return screen.getByRole("textbox", { name: /rename/i });
  }

  it("renames a connector through the API and shows the new name", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);

    const field = await openRename(user);
    await user.clear(field);
    await user.type(field, "prod-us-west-2");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByRole("button", { name: "prod-us-west-2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "prod-us-west" })).not.toBeInTheDocument();
  });

  it("rejects a name the schema does not accept and keeps the old one", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);

    const field = await openRename(user);
    await user.clear(field);
    await user.type(field, "Prod US West");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/lowercase letters, numbers, and hyphens/i);
    expect(screen.getByRole("textbox", { name: /rename/i })).toBeInTheDocument();
  });

  // The duplicate check only exists on the mock's side of the boundary, so this
  // is the test that proves the request is really being made and answered.
  it("surfaces the server's conflict when the name is taken", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);

    const field = await openRename(user);
    await user.clear(field);
    await user.type(field, "prod-eu-central");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/already exists/i);
    expect(screen.getByRole("button", { name: "prod-eu-central" })).toBeInTheDocument();
  });

  it("restores the original name on cancel", async () => {
    const { user } = renderApp();
    await signIn(user, "editor@alkira.com");
    await completeMfa(user);

    const field = await openRename(user);
    await user.clear(field);
    await user.type(field, "discarded-name");
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.getByRole("button", { name: "prod-us-west" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /rename/i })).not.toBeInTheDocument();
  });

  it("offers no rename control to a read-only role", async () => {
    const { user } = renderApp();
    await signIn(user, "viewer@alkira.com");
    await completeMfa(user);

    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /rename/i })).not.toBeInTheDocument();
  });
});
