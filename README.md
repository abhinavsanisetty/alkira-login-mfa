# Login + MFA + Role-Based Access Control

Password login, a second factor, form validation, and a protected screen whose available actions
depend on the signed in user's role.

Everything you need is below: how to run it, the accounts to sign in with, how to walk the flow,
why it is built this way, and what I knowingly left undone.

---

## Technologies used

| Area | Choice | Why |
|---|---|---|
| Build and language | Vite, TypeScript, React 19 | JSX needs a build step, and TypeScript lets the auth state machine be enforced by the compiler |
| State | React Context and `useReducer` | The reducer is the state machine. Four fields do not need a dependency |
| Routing | React Router 7 | Guards are layout routes, so protection is structural |
| Styling | Tailwind v4 with `cva` and `tailwind-merge` | Tokens live in `@theme`, and utilities never leak into feature code |
| Type | Cormorant and IBM Plex Sans, self hosted | Serif for identity, sans for interface. The two never appear at the same size |
| Forms | react-hook-form and Zod | One schema is the source of truth for the form and for the mock API |
| Mock API | MSW (Mock Service Worker) | The app makes real `fetch` calls, and the mock lives outside `src/` |
| Tests | Vitest and React Testing Library | Native to Vite, and the same MSW handlers serve both dev and tests |
| Lint | oxlint | Enforces the feature boundary rule |

---

## Setup

Requires Node 20.19 or newer, or Node 22.12 or newer. That is what Vite 8 asks for.

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

There is no backend to start and nothing to configure. MSW intercepts the app's `fetch` calls at
the network layer and answers them itself.

---

## Mock accounts

Both use the password `Password123!`.

| Email | Role | What they can do |
|---|---|---|
| `viewer@alkira.com` | Viewer | View connectors. Create, edit, and delete controls are not rendered at all |
| `editor@alkira.com` | Editor | View, create, edit, and delete connectors |


The one time code is not emailed anywhere. It appears in a Dev inbox panel docked beside the MFA
form, which is the one part of MFA that cannot exist without a backend. Everything else about the
code is real: random generation, five minute expiry, three attempts, and single use. The code
itself is never sent to the client, which receives only a challenge id, the address it went to, and
the attempts remaining.

---

## How to test the login and MFA flow

**The happy path**

1. Open `http://localhost:5173` and you land on `/login`.
2. Sign in as `editor@alkira.com` with `Password123!`.
3. The MFA screen appears and a six digit code arrives in the Dev inbox, which sits to the right of
   the form on a wide window and below it on a narrow one.
4. Enter it. You land on the protected connectors screen, with your name and role in the header.

**Validation and error handling**

- Submit an empty form, or type `not-an-email`. Errors appear on blur, then clear as you fix them.
- Sign in with `nobody@alkira.com` and you get "No account with that email."
- Use a real address with the wrong password and you get "Incorrect password."
- Fail login five times inside a minute. The next attempt returns 429, "Too many attempts. Wait a
  minute and try again."
- Enter a wrong code and the attempt counter drops.
- Enter three wrong codes and the challenge is destroyed, which returns you to sign in.
- Press Resend code. A new code arrives and the previous one is struck through. Try the old one and
  it is rejected.

**MFA is not decorative**

- While on the MFA screen, edit the URL to `/connectors`. You are redirected, because a verified
  password and a live challenge are not a session.
- Sign out, then navigate straight to `/mfa`. You are sent to `/login`, since the challenge screen
  is not reachable without passing the first factor.
- Sign in fully and refresh. You stay signed in, via `sessionStorage`. Now sign in again and
  refresh during the MFA step. You are returned to login, because a half completed authentication
  is deliberately never persisted.

**Read only against read and write**

- As `editor@alkira.com`, the list has an Actions column with Edit and Delete on every row, plus a
  New connector button.
- Press Edit on a row. The name becomes an input with Save and Cancel, Enter saves, and Escape
  cancels. Rename `prod-us-west` to `prod-us-west-2` and it persists.
- Press Edit again and try `Prod US West`, which gives "Use lowercase letters, numbers, and
  hyphens." Try `prod-eu-central` and you get "A connector with that name already exists," a real
  409 from the mock rather than a client side guess. Cancel leaves the original name intact.
- Sign out and sign in as `viewer@alkira.com`. The Actions column is gone entirely, the create
  button is absent, and the header reads VIEWER.
- Click a connector name in either role. The row takes a royal edge down its left side, and only
  one row is ever marked.

**Automated**

```bash
npm test
```

67 tests. The reducer and the permission model are unit tested with no React involved, the mock API
is tested at its own boundary, and the flows above are covered end to end by integration tests that
drive the real components through the real `fetch` path.

I checked the suite by mutation rather than by coverage percentage. 25 deliberate bugs went into the
reducer, the permission map, the route guards, session persistence, the mock API, and the role
gating in the UI. 24 of them broke a test, which is the evidence that these tests assert something
instead of merely executing it.

Two of those mutations found real gaps, and both are closed now. Nothing had verified that signing
out clears the persisted session, and nothing reached the server side validation on rename, because
the form validates before it sends. That second gap is why `src/mocks/handlers.test.ts` exists.

The one survivor is documented in the code. Each row action checks its own permission as well as
sitting behind the Actions column, and with today's three roles those two checks are equivalent, so
removing the inner one breaks nothing. It stays for the day a role gets delete without edit.

---

## Key design decisions

The five that shaped the code most:

**1. Auth state is a discriminated union, not a bag of flags.**

```ts
type AuthState =
  | { status: "anonymous";     error?: AuthError }
  | { status: "awaitingMfa";   challenge: Challenge; error?: AuthError }   // no user
  | { status: "authenticated"; user: User };                              // no challenge
```

During MFA the user has proved one factor but is not authenticated, so the state holds a challenge
rather than a session. `user` does not exist on that variant, so reading a role from a half
authenticated state does not compile. With `{ isLoggedIn, needsMfa, user: User | null }` that same
bug is representable, and it depends on every consumer remembering to null check.

**2. A reducer, so illegal transitions are unwritten rather than discouraged.**
`{ status: "authenticated" }` is constructed in exactly one place, guarded on the current state
being `awaitingMfa`, so there is no code path that skips the second factor. The reducer is pure, so
the whole machine is tested without rendering anything.

**3. Authorization is a permission map behind one predicate.** Roles map to permission strings and
`can(user, permission)` is the only code that reads them, which makes the policy testable as a
truth table. Nothing stores `canEdit`. It is always derived, so it cannot go stale.

**4. Route guards are layout routes.** Anything nested inside a guard is protected by construction,
so protection cannot be forgotten. There are three. `RequireAuth` holds the connectors screen,
`RequireMfaPending` needs a live challenge so `/mfa` is not directly addressable, and
`RequireAnonymous` keeps a signed in or mid challenge visitor off login and sign up, which is also
what moves them forward once the first factor passes.

**5. The mock is MSW rather than a service module.** Application code calls `POST /api/auth/login`
and handles a real 401. Nothing in `src/` knows the backend is fake, so pointing at a real API
means deleting the mock instead of rewriting a service layer. The same handlers run in Node for the
tests.

### The visual system

The look is a stated set of rules rather than a default, and it is enforced structurally wherever
that is possible.

- **Two faces with different jobs.** Cormorant carries identity: page titles, the wordmark, card
  titles, connector names. IBM Plex Sans does the work: labels, hints, errors, buttons, badges,
  column headers, metadata. Cormorant is a Garamond revival with heavy stroke contrast, which makes
  it good at display sizes and bad at 13px, so it is never asked to do the second job. The scale
  keeps them apart by size as well as by role: Plex Sans never goes above `text-base`, and Cormorant
  never drops below `text-lg`, so the two never appear at the same size and never compete. IBM Plex
  Mono has one job, verification codes and region identifiers, where proportional digits would make
  a field reflow as you type.
- **One radius.** Every radius token in `@theme` collapses to the same 3px, so `rounded-sm` and
  `rounded-3xl` produce identical output. Inconsistency is unavailable rather than discouraged.
  Circles are the one exception, reserved for avatars.
- **One selection device.** An active list item takes a royal edge down its left side and never a
  filled background. The connector rows and the dev inbox both use it.
- **Matte throughout.** No gradients, glass, blur, or shadows. Separation comes from hairline rules
  and small tonal steps across three surface tokens.
- **No motion except loading.** Nothing eases, nothing transitions on hover, and nothing animates on
  arrival. A skeleton pulses and a spinner turns, and that is the entire inventory.
- **Hierarchy from weight and size.** Grey marks genuinely secondary text, but it never carries a
  distinction on its own.

The header is where royal blue stops being an accent. It fills the signed in shell edge to edge
while the signed out shell stays off white, so the palette itself marks the security boundary. In
dark mode the band darkens instead of lifting with the accent, because a full width band painted in
the lifted accent would be the brightest object on a near black page.

The theme control offers light and dark, with no follow the system option, and light is the default.
That is a trade rather than an oversight. A three way control respects the OS setting, but with only
two options an OS aware default would leave a dark OS visitor looking at the dark palette while the
toggle sat on Light, and the control would be lying. So `index.html` stamps `data-theme` before
first paint and never leaves it off, and the stylesheet carries no `prefers-color-scheme` rule at
all.

### Assumptions

- There is no backend. Everything server shaped is mocked at the network boundary.
- Mock users are seeded in code. There is no registration and no persistence.
- A modern evergreen browser. No IE and no legacy polyfills.
- The work is judged on the client. Where the client only version differs from what I would ship,
  the production design is stated in Known limitations rather than left implied.

---

## Known limitations

1. **All authorization is client side.** `can()` decides what to show. Anything shipped to a browser
   is attacker controlled, since the bundle can be read and the check patched in devtools. In
   production the server re-evaluates the same policy on every mutation, after loading the resource.
   The client decides what to show, and the server decides what to give.
2. **The one time code lives in client memory.** That is unavoidable without a backend. Generation,
   expiry, attempt limiting, and single use consumption are still real.
3. **The session sits in `sessionStorage`, which JavaScript can read.** I chose it over
   `localStorage` because it dies with the tab and is not shared across tabs. In production this is
   an `HttpOnly`, `Secure`, `SameSite` cookie with a `__Host-` prefix that JavaScript cannot touch
   at all.
4. **No session re-validation on boot.** A stored session is trusted on rehydration. Production
   would re-verify it against the server before rendering protected content.
5. **Login errors permit user enumeration.** "No account with that email" tells an attacker which
   addresses are registered. This is a deliberate trade-off rather than an oversight.
   I chose it for UX, since enumeration leaks through signup and password reset anyway, and
   mitigated it with per account rate limiting. For a product where account existence is itself
   sensitive, the generic message is correct and I would flip it.
6. **Rename is the only editable field.** Type, region, and status are fixed. The rename path is
   complete, with a shared schema, a 409 on a duplicate, and a 404 on a missing connector, so
   extending it to the other fields would be more of the same rather than anything new.
7. **There is no password reset flow.** I did not build one, though it is where recovery path
   security would need the most attention, since recovery is usually the weakest link in an auth
   system.
8. **The mock runs in production builds too.** Otherwise `npm run preview` would have nothing to
   talk to. With a real API, that one call in `src/main.tsx` is deleted.
