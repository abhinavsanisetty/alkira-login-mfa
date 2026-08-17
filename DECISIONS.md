# Design Decisions

Take-home exercise: **Login + MFA + Role-based Access Control**

This document records every significant technical decision made in this project: what was
chosen, what was rejected, why, and what trade-off was knowingly accepted. The README covers
*how to run* the app; this covers *why it is built this way*.

Where a decision differs from what I would ship to production, that difference is stated
explicitly rather than left implicit.

---

## Decision summary

| # | Decision | Choice | Primary reason |
|---|---|---|---|
| 1 | Build tool & language | Vite + TypeScript | JSX needs a build step; TS lets the auth state machine be compiler-enforced |
| 2 | State management | Context + `useReducer` | The reducer *is* the state machine; zero dependencies; pure and testable |
| 3 | Styling | Tailwind v4 + `cva` component layer | Token system in `@theme`; utilities never leak into feature code |
| 4 | Forms & validation | react-hook-form + Zod | One schema is the source of truth for form *and* mock API |
| 5 | Auth state shape | Discriminated union | Makes the MFA-bypass state impossible to represent |
| 6 | Session persistence | `sessionStorage`, authenticated state only | Survives refresh, dies with the tab; the pre-MFA challenge is never persisted |
| 7 | Mock backend | MSW (Mock Service Worker) | App makes real `fetch` calls; going live means deleting the mock, not rewriting the app |
| 8 | OTP delivery | Mock inbox panel | Makes the out-of-band boundary visible instead of asserted |
| 9 | Authorization model | Permission map + `can()` | One predicate, testable as a truth table; roles are data |
| 10 | Read-only gating | Hide + role badge | A table of disabled controls is noise; the badge explains the absence |
| 11 | Route protection | Layout routes + `<Outlet/>` | Protection is structural — you cannot forget to apply it |
| 12 | Protected content | Cloud Connectors table | Gives three distinct permission gates to demonstrate |
| 13 | Testing | Vitest + React Testing Library | Native to Vite; tests the decisions, not the pixels |
| 14 | Login error copy | Specific per field | Deliberate UX-over-enumeration-defense trade-off (see §14) |
| 15 | Role switching | Seeded accounts in README | No client-side role switching — it would contradict the security model |
| 16 | Sign Up scope | Route + validated form, no persistence | Exactly the stated scope; reuses the validation layer |

---

# Part 1 — Foundation

## 1. Build tool and language — Vite + TypeScript

**Decision:** Vite as the build tool, TypeScript as the language, React as the UI library.

These are three separate concerns, not competing choices. React needs a build step regardless,
because JSX is not valid JavaScript and no browser can execute it. The only question was which
tool fills that slot.

**Alternatives considered**

| Option | Why not |
|---|---|
| Vite + JavaScript | Loses the compiler-enforced state machine, which is the strongest architectural argument in this codebase |
| Create React App | Officially deprecated; no longer recommended by the React team |
| Next.js | Its entire value is a server layer, and the brief states no backend is required. It would add a runtime that is deliberately unused, plus server/client component boundaries and hydration semantics to explain — none of which relate to login, MFA, validation, or roles |

**Why TypeScript specifically:** the auth state is modelled as a discriminated union (§5). The
compiler prevents reading `user.role` from a state where the user has not yet completed MFA.
That is the exact shape of an authentication bypass, and it is better caught at build time than
in code review.

**Trade-off accepted:** slightly slower to write than plain JavaScript.

**Production note:** a Vite SPA is not a downgrade from Next.js — it is the correct architecture
when the React app sits in front of a separate backend API, which is the common enterprise shape.
Next.js would be the right call if we needed the route guard enforced before HTML is delivered,
or SEO on public marketing pages.

> **In an interview:** *"Vite is the build tool, TypeScript is the language, React is the UI library
> — three separate slots. React requires a build step regardless because JSX isn't valid JavaScript,
> so the real choice was which tool fills that slot, and Vite is the current standard. TypeScript
> is orthogonal and erased at compile time, so it costs nothing at runtime. I didn't reach for
> Next.js because its value proposition is a server layer the brief explicitly removed."*

---

## 2. State management — Context + `useReducer`

**Decision:** React Context holding a `useReducer` store, exposed through a `useAuth()` hook.
Components never touch the context directly.

**Alternatives considered**

| Option | Why not |
|---|---|
| Zustand | Least boilerplate and genuinely good, but a dependency to justify for four fields — and loose setters make it easy to lose the guarded-transition discipline |
| Redux Toolkit | Excellent devtools, but heavy ceremony here; risks reading as reaching for the enterprise hammer |
| Lifted `useState` | Prop drilling, and — more importantly — no enforced transitions. Any state becomes reachable from any state, which is structurally what an auth bypass looks like |

**Why:** a reducer is a state machine. Every transition is a named action with an explicit
handler, so illegal transitions are not merely discouraged, they are unwritten. And because the
reducer is a pure function, the entire auth state machine can be unit-tested without rendering
a single component.

**Trade-off accepted:** more boilerplate than Zustand (context, provider, action types, hook).

> **In an interview:** *"Redux solves cross-cutting state shared by distant components with complex
> async orchestration. I have one domain, one consumer tree, and three async calls. Context plus a
> reducer gave me guarded transitions without the ceremony, and the reducer is a pure function I can
> test with no React involved. If this grew to org switching, feature flags, and optimistic updates,
> I'd migrate — and the reducer would move over largely unchanged."*

---

## 3. Styling — Tailwind v4 with a `cva` component layer

**Decision:** Tailwind v4, with design tokens defined in a `@theme` block as real CSS custom
properties, and utility classes confined to a small `components/ui/` layer.

**Structure:**
- **Tokens** — colour, spacing, radius, and type scale live in one `@theme` block. A single
  readable source of truth rather than values scattered through markup.
- **Component layer** — utilities are never repeated across the app. Each primitive is exposed
  through `cva` as a typed variant API, so feature code writes `<Button variant="danger" size="sm">`
  rather than a class string.
- **Overrides** — a `cn()` helper (clsx + tailwind-merge) lets callers override styles predictably
  instead of losing to specificity conflicts.

**Alternatives considered**

| Option | Why not |
|---|---|
| Hand-written CSS Modules | Most directly demonstrates CSS authorship, and was a close call for a UI-focused role — but slower, and every focus/disabled/loading state is built from scratch |
| MUI / Chakra / Mantine | Fastest route to polished and accessible, and explicitly permitted — but the result looks like every other submission built on it, and hides the styling work entirely |
| Radix primitives + custom CSS | Excellent accessibility for free; arguably overkill for a UI that is mostly inputs, buttons, and a table |

**Why:** raw utility classes sprayed through JSX is the version of Tailwind that deserves
criticism — it hurts readability and demonstrates no system. Tokens plus a typed variant layer
is a design system with Tailwind as its constraint engine. Zero runtime cost, consistent scales
by default, and every component still authored here.

**Trade-off accepted:** does not showcase hand-written CSS as directly as CSS Modules would.

> **In an interview:** *"Tailwind, but the utilities don't leak. Tokens live in a `@theme` block as
> real custom properties — one source for colour, spacing, radius, and type. Utilities are
> concentrated in a `components/ui` layer where `cva` exposes each component as a typed variant API,
> so callers write `<Button variant='danger'>`, not a class string. `cn()` makes overrides
> predictable instead of specificity roulette. I still built every component myself; Tailwind is the
> constraint system underneath, not the component library."*

---

## 4. Forms and validation — react-hook-form + Zod

**Decision:** react-hook-form for form state, Zod for schemas. One schema per form, shared
between the form and the mock API handler.

**Alternatives considered**

| Option | Why not |
|---|---|
| Zod + a custom `useForm` hook | Demonstrates understanding, but reinvents a solved problem and usually gets the re-validation-after-touch timing subtly wrong |
| Fully hand-rolled | No shared type inference, slower, and worse validation timing than RHF ships with |
| Formik + Yup | Formik is in maintenance mode and Yup's TypeScript inference is weaker than Zod's |

**Why:** the Zod schema is a contract, and both sides of the boundary use it. The form validates
against it for immediate feedback; the MSW handler parses the request body with the same schema.
That mirrors how a real client and server share a contract, and it means client and server can
never silently disagree about what a valid payload is. `z.infer` also derives the TypeScript
types, so there is no separate type definition to drift.

**Validation timing:** validate on blur, then re-validate on change once a field has been
touched. Validating on every keystroke from an empty field is hostile — it tells you an email is
invalid before you have finished typing the first character.

**Trade-off accepted:** two dependencies for two forms.

> **In an interview:** *"Client validation is UX — it tells you early. The server's parse is the
> actual gate. The reason I like the Zod schema here is that it's the same object on both sides of
> that boundary: the form validates against it, and the mock API parses with it. With a real backend,
> that schema moves to a shared package or is mirrored server-side. What doesn't change is that I
> never treat the client result as trustworthy."*

---

# Part 2 — Authentication architecture

## 5. Auth state shape — discriminated union

**Decision:** the auth state is a tagged union where each state carries only the data that is
valid in that state.

```ts
type AuthState =
  | { status: "anonymous";    error?: AuthError }
  | { status: "awaitingMfa";  challenge: Challenge }   // no user
  | { status: "authenticated"; user: User };           // no challenge
```

**This is the most important decision in the codebase.**

**Alternatives considered**

| Option | Why not |
|---|---|
| Flat flags — `{ isLoggedIn, needsMfa, user \| null }` | Encodes impossible states. `isLoggedIn: false` alongside a populated `user` is representable, and one component reading `user.role` without checking the flag is a real access-control bug |
| XState | A genuine statechart with first-class guards, and the right tool if MFA had many branches — but a large dependency and a whole DSL to defend for three states |
| Union with all fields optional | Keeps the optionality that causes the bugs while losing the compiler guarantee. Worst of both |

**Why:** during MFA, the user has proved one factor but is not authenticated. The system holds a
*challenge*, not a session — it carries no permissions and opens no doors. Modelling that as
`user: null` relies on every consumer remembering to null-check. Modelling it as a separate
variant means `user` **does not exist** on that state, and reading it does not compile.

The type is also a readable state diagram: the three variants and their payloads are the
specification.

**Trade-off accepted:** consumers must narrow on `status` before accessing state data.

> **In an interview:** *"The MFA bypass is a type error waiting to happen. With flags, a logged-out
> state holding a populated user is representable, and one component reading the role without
> checking the flag is a real access-control bug. With a tagged union, the authenticated state is
> the only one with a `user` field at all — the compiler enforces the state machine instead of me
> remembering to."*

---

## 6. Session persistence — `sessionStorage`, authenticated state only

**Decision:** the authenticated session is persisted to `sessionStorage`. The pre-MFA challenge
is **never** persisted.

**Alternatives considered**

| Option | Why not |
|---|---|
| Nothing (in-memory only) | Defensible — "no persistence beats insecure persistence" — but a refresh mid-demo logs you out |
| `localStorage` | Survives indefinitely with no expiry unless one is built, and it's the storage choice security reviewers reflexively flag |
| `sessionStorage` + re-validate on boot | Strictly better and closest to production: don't trust the stored session, re-verify it against the API on startup. Not implemented here to avoid a boot loading state; noted as a known limitation |

**Why `sessionStorage` over `localStorage`:** it dies when the tab closes, which matches what a
session should mean. It is also not shared across tabs, so its blast radius is naturally smaller.

**Why the challenge is excluded:** a half-completed authentication surviving a page refresh is
exactly what MFA exists to prevent. Refreshing during the OTP step returns you to login, and that
is correct behaviour, not a bug.

**Trade-off accepted:** `sessionStorage` is readable by any JavaScript running on the page, so an
XSS vulnerability could read it. This is acceptable here because the stored value is mock data,
but it is not the production design.

**Production note:** the session would be an `HttpOnly`, `Secure`, `SameSite` cookie the JavaScript
cannot read at all, ideally with a `__Host-` prefix. The client would keep only non-sensitive
display data, and would re-validate against the server on boot rather than trusting local state.

> **In an interview:** *"`sessionStorage`, and only the authenticated state — never the pre-MFA
> challenge, because a half-completed authentication surviving a refresh is the thing MFA exists to
> prevent. I know `sessionStorage` is XSS-readable; in production the session is an `HttpOnly` cookie
> the JS can't touch. The client copy is a cache for rendering, not the authority."*

---

## 7. Mock backend — MSW (Mock Service Worker)

**Decision:** the mock API is implemented as MSW request handlers. Application code makes real
`fetch` calls to real URLs (`POST /api/auth/login`, `POST /api/auth/mfa/verify`, etc.); MSW
intercepts them at the network layer.

**Alternatives considered**

| Option | Why not |
|---|---|
| Plain async service module | Simpler and completely defensible, but the app never makes a real network call, so HTTP semantics — status codes, headers, real latency — go unexercised |
| Local Express / json-server | Genuinely a backend, but the brief says none is required, and it adds a second thing for the reviewer to install and run |
| Synchronous functions | No loading states and no async error handling — skipping the two things async UI work is judged on |

**Why:** the mock lives entirely outside `src/`. Nothing in the application knows it is talking
to a mock. That means the migration story is *deleting a file*, not rewriting a service layer —
and it means the loading states, error paths, and status-code handling in the UI are real rather
than simulated.

The same handlers also power the test suite (Node adapter in tests, service worker in the
browser), so tests exercise the same request/response contract the app uses in development.

**What the mock implements faithfully:** artificial latency, HTTP status codes (`401`, `429`,
`400`), a typed error taxonomy (`INVALID_CREDENTIALS`, `OTP_INVALID`, `OTP_EXPIRED`,
`TOO_MANY_ATTEMPTS`, `RATE_LIMITED`), and rate limiting on the login endpoint.

**Trade-off accepted:** more setup than a plain module — a worker file in `public/`, dev-only
initialisation, and a Node setup file for tests.

> **In an interview:** *"How would I swap in a real backend? Delete the worker registration. My
> components already call `POST /api/auth/login` and handle a 401 — the only thing that changes is
> who answers. That was the point of choosing MSW over a service module: the seam is at the network
> boundary, where it will be in production, not inside my application code."*

---

## 8. OTP delivery — mock inbox panel

**Decision:** the OTP itself is implemented for real. Delivery — the one part that cannot exist
without a backend — is surfaced through a mock inbox panel docked beside the MFA screen.

**What is real:**

| Behaviour | Implemented |
|---|---|
| Random 6-digit code generation | Yes |
| 5-minute expiry | Yes |
| 3-attempt limit, then challenge destroyed | Yes |
| Single-use consumption on success | Yes |
| Client receives only a `challengeId`, never the code | Yes |
| Resend invalidates the previous code | Yes |
| Out-of-band delivery | **No — requires a mail provider** |

**Alternatives considered**

| Option | Why not |
|---|---|
| Hardcoded code (`123456`) | Deletes generation, expiry, attempt limiting, and single-use — the entire mechanism |
| `console.log` | Requires devtools open; reviewers may assume the app is broken, and it is invisible in a screen-recorded demo |
| Real TOTP with an authenticator app | Genuinely working MFA with no backend, and a spectacular flourish — but it requires the reviewer to have a phone and an authenticator app, which makes the demo unrunnable if they don't. Scope creep on a brief that says "a mock MFA method" |

**Why a panel and not a separate route:** if the reviewer must navigate away from the MFA form
to read the code and then navigate back, the demo gains friction and the challenge state has to
survive the round trip. The panel is docked beside the challenge so both are visible at once.

**Why it earns its place:** it makes the out-of-band boundary *visible* rather than asserted. The
reviewer watches the code arrive through a channel separate from the login form, and pressing
"resend" produces a second message that visibly invalidates the first — demonstrating single-use
semantics rather than describing them. The panel is explicitly labelled as a development
affordance.

**Honest limitation:** because the "server" is a module running in the same browser, the code is
technically present in client memory. That is unavoidable without a backend and is stated in the
README rather than glossed over.

> **In an interview:** *"The OTP mechanics are real — six digits, five-minute expiry, three attempts,
> single-use, tied to a challenge ID that's the only thing the client receives. The one piece that
> can't exist without a backend is out-of-band delivery, so rather than hardcode a code or hide it
> in the console, I built a mock inbox docked next to the challenge. Resending shows the previous
> code being invalidated. Swapping that panel for a real mailer wouldn't touch the generation or
> verification code at all."*

---

# Part 3 — Authorization

## 9. Authorization model — permission map + `can()`

**Decision:** roles map to sets of permission strings. A single `can(user, action)` predicate
gates every capability in the application.

```ts
const PERMISSIONS = {
  viewer: ["connector:view"],
  editor: ["connector:view", "connector:create",
           "connector:edit", "connector:delete"],
  admin:  ["connector:view", "connector:create",
           "connector:edit", "connector:delete", "user:manage"],
} as const;
```

**Alternatives considered**

| Option | Why not |
|---|---|
| Boolean flags on the user (`user.canEdit`) | Every new capability is a new field on every user, flags can contradict the role, and nothing reconciles them |
| Inline role comparisons (`role === "editor" && …`) | Authorization logic scatters across every component, becomes untestable in isolation, and adding a role means grepping the codebase |
| RBAC + resource ownership (ABAC-lite) | Genuinely more capable, but the brief asked for read-only vs read/write, and ownership rules muddy that demonstration. Described as the extension path rather than built (see below) |

**Why a third role was added:** the brief requires two. Two roles can be satisfied by a boolean,
and a boolean is not a model. A third role (`admin`) proves the design generalises — adding it
was a data change, not a code change, which is the entire argument for the approach.

**Why one predicate:** `can()` is the only function that knows the rules. That makes the whole
policy unit-testable as a truth table — every role against every action — with no React involved.
It also has the same shape a server-side check would have, so the same predicate concept moves
across the boundary unchanged.

**Known limit of this model:** it is role-only. It cannot express *"editors may delete connectors
they created, but not connectors created by others."* That requires passing the resource into the
predicate — `can(user, action, resource)` — and adding an ownership condition. Same function
signature, one more argument.

**Critical caveat, documented in the README:** in this exercise `can()` runs only in the browser,
so it is a UX control, not a security control. Anything shipped to a browser is
attacker-controlled — the bundle can be read and the check patched in devtools. In production the
server re-evaluates the same policy on every mutation, after loading the resource. **The client
decides what to show; the server decides what to give.**

> **In an interview:** *"Why not check the role inline? Because then authorization lives in forty
> components instead of one file. With a permission map, `can()` is the only thing that knows the
> rules — I can unit-test the entire policy as a truth table with no React involved, and adding a
> role is a data change. I added a third role beyond the two required specifically to show it
> generalises. The limit is that it's role-only: it can't express 'editors may delete their own
> connectors but not others'. For that I'd pass the resource into `can()` and add an ownership
> condition."*

---

## 10. Read-only gating — hide, plus a role badge

**Decision:** actions unavailable to the current role are **hidden**, not disabled. The header
displays a role badge (`Viewer` / `Editor` / `Admin`).

The brief permitted either — the reasoning is the deliverable.

**Why hide, in this specific UI:** the protected screen is a table. Disabling would render two
dead controls on every row — twenty rows means forty greyed buttons the user can never use. That
is noise, not discoverability. Hiding lets the entire actions column collapse, so a viewer gets a
clean read view rather than a mutilated edit view.

**Why the role badge is not optional:** the standard objection to hiding is discoverability —
users can't tell whether a feature is missing or merely forbidden, which becomes a support
ticket. The badge answers that: absence is not mysterious when the UI has already stated who you
are. **Without the badge, hiding looks like a bug; with it, it looks like a policy.**

**Alternatives considered**

| Option | Why not |
|---|---|
| Disable + tooltip | The better choice on a *detail* page with one Edit button — a single dead control that teaches you to request access is worth more than a missing one. Wrong for a table |
| Mixed (hide creation, disable row actions) | Reasonable, but requires articulating a rule per case or it reads as inconsistent |
| Show, then block with an error toast | Deliberately lets users attempt something guaranteed to fail |

**Accessibility note:** had disabling been chosen, the correct implementation would use
`aria-disabled="true"` with the element kept focusable and the handler no-op'd — a natively
`disabled` button is removed from the tab order, which makes the tooltip explaining *why* it is
disabled unreachable by keyboard and screen-reader users. Recorded here because it is the reason
disabled-with-tooltip is harder to do correctly than it appears.

> **In an interview:** *"Both were allowed, and it's contextual. In a table, disabling means every
> row renders dead controls — that's noise, not discoverability. Hiding collapses the actions column
> so a viewer gets a clean read view. I paired it with a role badge so the absence is explained
> rather than mysterious. If this were a single detail page with one Edit button, I'd flip to
> disabled-with-tooltip."*

---

## 11. Route protection — layout routes with `<Outlet/>`

**Decision:** two guards implemented as layout routes.

```tsx
<Route element={<RequireMfaPending/>}>
  <Route path="/mfa" element={<MfaScreen/>}/>
</Route>

<Route element={<RequireAuth/>}>
  <Route path="/connectors" element={<Connectors/>}/>
  <Route path="/settings"   element={<Settings/>}/>
</Route>
```

**Alternatives considered**

| Option | Why not |
|---|---|
| Wrapper component per route | Explicit at each call site, but repeated — and a forgotten wrapper is an unprotected route |
| Data-router `loader` redirects | Guard runs before render, avoiding any flash of protected content; more router machinery to introduce |
| Conditional render, no router | No URLs, no back button, no deep links — and the guard becomes undemonstrable because there is no address to type |

**Why layout routes:** protection becomes structural. Anything nested inside the guard route is
protected by construction, so it is not possible to forget. The route tree itself reads as the
security boundary.

**Why two guards:** `RequireAuth` is the obvious one. `RequireMfaPending` is the one that matters
— it requires a live challenge to exist, so `/mfa` cannot be reached without first passing
password verification. Without it, the OTP screen is directly addressable and the first factor
becomes skippable.

**Redirect memory:** the originally requested path is preserved and restored after successful
authentication, rather than always landing on the dashboard.

> **In an interview:** *"What stops me typing `/connectors` directly? The guard redirects — but the
> guard is UX, not the security boundary; a real API would 401 regardless. The more interesting case
> is `/mfa`, which has its own guard requiring a live challenge, so you can't skip password
> verification and land on the OTP screen. And because the auth state is a tagged union, the
> authenticated branch is the only one carrying a user at all — a component couldn't read a role
> from a half-authenticated state even if a guard were missing."*

---

## 12. Protected screen content — Cloud Connectors

**Decision:** the protected screen is a table of cloud connectors — Name, Type (AWS / Azure / GCP),
Region, Status — with a page-level "New Connector" action and per-row Edit and Delete actions.

**Why this shape:** it yields three distinct permission gates at two different levels (one
page-level, two row-level), which demonstrates that `can()` is consulted consistently rather than
applied once. A single button would not prove that.

**Why this domain:** Alkira builds multi-cloud networking infrastructure, so connectors are
plausible domain content rather than generic placeholder data. It is kept deliberately shallow —
no invented product specifics — because getting a company's domain visibly wrong is worse than
staying generic.

**Alternatives considered**

| Option | Why not |
|---|---|
| Generic Documents table | Same permission gates, zero research risk — but the forgettable default |
| User management table | Thematically tied to auth, but recursive and confusing to demo, and raises privilege-escalation questions outside the brief's scope |
| Dashboard of metric cards | Looks impressive, but metrics aren't editable — there is nothing for read/write to act on, which undermines the requirement being tested |

---

# Part 4 — Quality and scope

## 13. Testing — Vitest + React Testing Library

**Decision:** Vitest with React Testing Library, sharing the MSW handlers used in development.

The goal is not coverage percentage. It is to test the **decisions** documented above.

| Test | What it proves |
|---|---|
| Reducer transitions | The auth state machine is correct in isolation, with no React |
| `can()` truth table | Every role × action pair resolves correctly |
| Validation rules | Each rule fires and clears at the right time |
| Login integration | Invalid email blocks submit; valid credentials advance to MFA |
| MFA integration | Wrong OTP decrements attempts; correct OTP authenticates |
| Wrong-code exhaustion | Three failures destroy the challenge and return to login |
| Guard — anonymous | Direct navigation to a protected route redirects |
| **Guard — password-verified but pre-MFA** | Still redirected. **This is the test that proves MFA is not decorative** |
| Role rendering | Viewer sees no action column; editor does |

**Alternatives considered**

| Option | Why not |
|---|---|
| Vitest + RTL + a Playwright E2E | A single end-to-end walk of login → MFA → protected → role check is a powerful artifact; deferred as a stretch goal rather than a core requirement |
| Jest + RTL | Extra configuration for Vite and ESM, for no gain over Vitest |
| Unit tests only | Skips the integration behaviour — form submission, guard redirects, role rendering — which is the substance of the exercise |

---

## 14. Login error copy — specific per field *(deliberate trade-off)*

**Decision:** login failures are reported specifically. An unrecognised email returns *"No account
with that email"*; a recognised email with the wrong password returns *"Incorrect password."*

**The trade-off being accepted, stated plainly:** this permits **user enumeration**. An attacker
can script a list of addresses against the login endpoint and learn which are registered,
producing a target list for credential stuffing or phishing. It is a recognised OWASP finding.

**Why it was chosen anyway:**

1. **Enumeration usually leaks elsewhere regardless.** A signup form must reject duplicate
   addresses, and password reset behaves observably differently for known and unknown accounts.
   Being vague *only at login* often buys little while degrading the most frequently encountered
   error message in the product.
2. **Precedent.** Google and Slack both disclose whether an account exists; GitHub does not. It is
   a product posture, not a settled correctness question.
3. **Materially better UX.** *"Incorrect password"* tells a user to try a different password.
   *"Email or password is incorrect"* makes them re-check both, including the part they got right.

**Mitigation implemented:** the login endpoint is rate-limited per email address in the mock API
(`429 RATE_LIMITED`). Enumeration is only cheap when it is fast; throttling makes bulk probing
impractical rather than free.

**Posture consistency:** the same disclosure level is applied across login, signup, and reset.
There is no value in being vague in one place and specific in another.

**When I would flip this:** any product where the *existence* of an account is itself sensitive —
financial services, healthcare, dating, anything where "this person has an account here" is a
disclosure. There the generic message is correct and the UX cost is worth paying.

**Note:** non-credential errors are always specific — expired OTP, attempts exhausted, malformed
input. Enumeration risk applies only to the identity check, so blanket vagueness elsewhere would
be cargo-culting the mitigation.

> **In an interview:** *"That's a deliberate trade-off and I'll name it: specific messages permit user
> enumeration. I chose UX because enumeration leaks through signup and password reset anyway, so
> being vague only at login buys little while making the most common error message the least
> helpful. I mitigated it with per-account rate limiting, and I held the same posture across signup
> and reset rather than being inconsistent. For a bank or a health product I'd flip it — there,
> account existence is itself sensitive."*

---

## 15. Role switching — seeded accounts in the README

**Decision:** roles are demonstrated with seeded accounts documented in the README. There is no
in-app role switcher.

**Why not a role switcher:** it would be fiction. Users cannot change their own role, and a
control implying otherwise contradicts the security model this codebase argues for throughout —
that the client renders permissions and the server assigns them. Convenience in a demo is not
worth undermining the point.

**Alternatives considered**

| Option | Why not |
|---|---|
| Quick-fill "sign in as…" buttons on the login page | Genuinely reduces reviewer friction and does not misrepresent the model — a reasonable addition, deliberately omitted to keep the login screen honest to what a real one looks like |
| In-app role switcher | Fastest to compare, but misrepresents how authorization works |

**Cost accepted:** comparing roles requires logging out and completing the MFA flow again. The
README documents both accounts and the exact steps.

---

## 16. Sign Up scope — route with validated form, no persistence

**Decision:** Sign Up is a real route with a real form and real Zod validation. Submitting
displays a clear message that registration is not implemented in this exercise.

The brief states: *"Include a simple Sign Up flow that navigates to a separate screen. Full
registration is not required."*

**Why this level:** a bare placeholder satisfies the letter of the requirement but wastes the
opportunity — the validation layer already exists, so wiring a second form to it costs very
little and demonstrates the schema approach twice. Implementing full registration would be scope
creep, dragging in password-strength policy, duplicate-email handling, and an email verification
flow that the brief explicitly excludes.

**Behaviour on submit:** an explicit, honest message rather than a silent no-op or a fake success.
Pretending to succeed would be worse than not implementing it.

---

# What is mocked, and what production does instead

| In this exercise | In production |
|---|---|
| Passwords compared in a mock handler | Argon2id hash with a per-user salt and a KMS-held pepper, compared server-side |
| OTP surfaced in a mock inbox panel | Delivered out-of-band by email or authenticator app; never reaches the client |
| Challenge stored in browser memory | Server-side store with TTL, attempt counter, and single-use consumption |
| Session in `sessionStorage` | `HttpOnly`, `Secure`, `SameSite` cookie with a `__Host-` prefix, unreadable by JavaScript |
| `can()` evaluated in the browser | Same policy re-evaluated server-side on every mutation, after loading the resource |
| Role read from client state | Role read from the server-side session on every request |
| Rate limiting simulated in MSW | Per-IP and per-account throttling with exponential backoff at the edge |
| Route guard is the first check | Server middleware or API returns 401/403 regardless of what the client does |

---

# Known limitations

1. **All authorization is client-side.** `can()` is a UX control here, not a security control.
   Documented rather than implied.
2. **The OTP is present in client memory.** Unavoidable without a backend; the generation,
   expiry, and consumption logic is nonetheless real.
3. **No session re-validation on boot.** The stored session is trusted on rehydration. Production
   would re-verify against the server.
4. **Login errors permit user enumeration.** A deliberate, documented trade-off (§14), mitigated
   with rate limiting.
5. **No password reset flow.** Out of scope for the brief, but it is where recovery-path security
   would need the most attention — recovery is usually the weakest link in an auth system,
   regardless of how strong the primary factors are.
6. **Registration is not implemented.** The form validates; it does not persist.
