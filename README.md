# Login + MFA + Role-Based Access Control

A small authentication experience: password login, a second factor, form validation, and a
protected screen whose actions depend on the signed-in user's role.

`DECISIONS.md` is the companion to this file. This one covers **how to run it**; that one covers
**why it is built this way**, decision by decision, including what was rejected and what
trade-off was knowingly accepted.

---

## Technologies used

| Area | Choice | Why, in one line |
|---|---|---|
| Build & language | Vite, TypeScript, React 19 | JSX needs a build step; TS lets the auth state machine be compiler-enforced |
| State | React Context + `useReducer` | The reducer *is* the state machine — no dependency needed for four fields |
| Routing | React Router 7 | Guards are layout routes, so protection is structural |
| Styling | Tailwind v4 + `cva` + `tailwind-merge` | Tokens in `@theme`; utilities never leak into feature code |
| Forms | react-hook-form + Zod | One schema is the source of truth for the form *and* the mock API |
| Mock API | MSW (Mock Service Worker) | The app makes real `fetch` calls; the mock lives outside `src/` |
| Tests | Vitest + React Testing Library | Native to Vite; the same MSW handlers serve dev and tests |
| Lint | oxlint | Enforces the feature-boundary rule described below |

---

## Setup

Requires Node 20 or newer.

```bash
git clone https://github.com/abhinavsanisetty/alkira-login-mfa.git
cd alkira-login-mfa
npm install
```

## Running locally

```bash
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm test           # run the suite once
npm run test:watch # watch mode
npm run coverage   # coverage report
npm run typecheck  # tsc, no emit
npm run lint       # oxlint
npm run build      # production build
npm run preview    # serve the production build
```

There is no backend to start and nothing to configure. MSW intercepts the app's `fetch` calls
at the network layer and answers them itself.

---

## Mock accounts

All three use the password **`Password123!`**.

| Email | Role | What they can do |
|---|---|---|
| `viewer@alkira.com` | Viewer | View connectors. No create, edit, or delete — those controls are not rendered |
| `editor@alkira.com` | Editor | View, create, edit, delete connectors |
| `admin@alkira.com` | Admin | Everything an editor can, plus `user:manage` |

The brief asked for two roles. A third exists to show the permission model generalises: adding
`admin` was a change to a data structure, not to any component.

**The one-time code is not emailed anywhere.** It appears in a "Dev inbox" panel docked beside
the MFA form — the one part of MFA that cannot exist without a backend. Everything else about
the code is real: random generation, five-minute expiry, three attempts, single use, and a
`challengeId` that is the only thing the client ever receives.

---

## How to test the login / MFA flow

**The happy path**
1. Go to `http://localhost:5173` — you land on `/login`.
2. Sign in as `editor@alkira.com` / `Password123!`.
3. The MFA screen appears and a six-digit code arrives in the Dev inbox on the right.
4. Enter it. You land on the protected connectors screen with an **Editor** badge in the header.

**Validation and error handling**
- Submit an empty form, or type `not-an-email` — errors appear on blur, then clear as you fix them.
- Sign in with `nobody@alkira.com` → *"No account with that email."*
- Sign in with a real address and the wrong password → *"Incorrect password."*
- Fail login five times within a minute → `429`, *"Too many attempts."*
- Enter a wrong code → the attempt counter decrements.
- Enter three wrong codes → the challenge is destroyed and you are returned to sign-in.
- Press **Resend code** → a new code arrives and the previous one is struck through. Try the old
  one; it is rejected.

**That MFA is not decorative**
- While on the MFA screen, edit the URL to `/connectors`. You are redirected — a verified password
  and a live challenge are not a session.
- Sign out, then navigate directly to `/mfa`. You are redirected to `/login`; the challenge screen
  is not reachable without passing the first factor.
- Sign in fully, then refresh. You stay signed in (`sessionStorage`). Now sign in again and refresh
  **during** the MFA step — you are returned to login, because a half-completed authentication is
  deliberately never persisted.

**Read-only vs read/write**
- Sign in as `editor@alkira.com`: the table has an Actions column with Edit and Delete on each row,
  and a **New connector** button.
- Sign out, sign in as `viewer@alkira.com`: the Actions column is gone entirely, the create button
  is absent, and the header badge reads **Viewer**.

**Automated**

```bash
npm test
```

45 tests. The reducer and the permission model are unit-tested with no React involved; the flow
above is covered end-to-end by integration tests driving the real components through the real
`fetch` path.

---

## Key design decisions

Full reasoning, alternatives, and trade-offs are in `DECISIONS.md`. The five that matter most:

**1. The auth state is a discriminated union, not a bag of flags.**

```ts
type AuthState =
  | { status: "anonymous";     error?: AuthError }
  | { status: "awaitingMfa";   challenge: Challenge }   // no user
  | { status: "authenticated"; user: User };            // no challenge
```

During MFA the user has proved one factor but is not authenticated, so the state holds a
*challenge*, not a session. `user` does not exist on that variant — reading a role from a
half-authenticated state does not compile. With `{ isLoggedIn, needsMfa, user: User | null }`
that same bug is representable and depends on every consumer remembering to null-check.

**2. A reducer, so illegal transitions are unwritten rather than merely discouraged.**
`{ status: "authenticated" }` is constructed in exactly one place, guarded on the current state
being `awaitingMfa`. There is no code path that skips the second factor. The reducer is pure, so
the entire machine is tested without rendering anything.

**3. Authorization is a permission map behind one predicate.** Roles map to permission strings and
`can(user, permission)` is the only code that reads them, which makes the whole policy testable as
a truth table. Nothing stores `canEdit` — it is always derived, so it cannot go stale.

**4. Route guards are layout routes.** Anything nested inside a guard is protected by construction,
so protection cannot be forgotten. There are two: `RequireAuth`, and `RequireMfaPending`, which
requires a live challenge so `/mfa` is not directly addressable.

**5. The mock is MSW, not a service module.** Application code calls `POST /api/auth/login` and
handles a real `401`. Nothing in `src/` knows the backend is fake, so pointing at a real API means
deleting the mock rather than rewriting a service layer. The same handlers run in Node for tests.

### Assumptions

- No backend, per the brief. Everything server-shaped is mocked at the network boundary.
- Mock users are seeded in code; there is no registration or persistence.
- Modern evergreen browser. No IE or legacy polyfills.
- The exercise is judged on the client. Where the client-only version differs from what I would
  ship, `DECISIONS.md` states the production design instead of leaving it implied.

---

## Known limitations

1. **All authorization is client-side.** `can()` decides what to *show*. Anything shipped to a
   browser is attacker-controlled — the bundle can be read and the check patched in devtools. In
   production the server re-evaluates the same policy on every mutation, after loading the
   resource. The client decides what to show; the server decides what to give.
2. **The one-time code exists in client memory.** Unavoidable without a backend. Generation,
   expiry, attempt limiting, and single-use consumption are nonetheless real.
3. **The session is in `sessionStorage`, which JavaScript can read.** Chosen over `localStorage`
   because it dies with the tab and is not shared across tabs. In production this is an `HttpOnly`,
   `Secure`, `SameSite` cookie with a `__Host-` prefix that JavaScript cannot touch at all.
4. **No session re-validation on boot.** A stored session is trusted on rehydration. Production
   would re-verify it against the server before rendering protected content.
5. **Login errors permit user enumeration.** *"No account with that email"* tells an attacker which
   addresses are registered. This is a deliberate, documented trade-off (`DECISIONS.md` §14) —
   chosen for UX because enumeration leaks through signup and password reset anyway, and mitigated
   with per-account rate limiting. For a product where account existence is itself sensitive, the
   generic message is correct and I would flip it.
6. **Edit is a stub.** The Edit button demonstrates the permission gate; it opens no form. Create
   and Delete are wired through to the mock API.
7. **No password reset flow.** Out of scope, but it is where recovery-path security would need the
   most attention — recovery is usually the weakest link in an auth system.
8. **The mock runs in production builds too.** `npm run preview` would otherwise have nothing to
   talk to. With a real API, that call in `src/main.tsx` is deleted.

---

## AI usage

I used Claude while building this, which the brief permits. It was used for scaffolding, drafting
component and test code, and as a sounding board for the trade-offs recorded in `DECISIONS.md`.

Every decision in that document is one I made and can defend, including the ones where I chose
against the more obvious option. I have read all of the code in this repository and am happy to
walk through any file, explain why it is shaped the way it is, or argue the other side of any
trade-off in `DECISIONS.md`.
