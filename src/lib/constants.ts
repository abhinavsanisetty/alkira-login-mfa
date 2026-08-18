/** Every tunable value in one place. Scattered through the codebase as
 *  literals these are invisible; collected here they read as policy. */

/* -------------------------------------------------------------------------
   One-time passcode policy
   ------------------------------------------------------------------------- */

/** Digits in a generated passcode. */
export const OTP_LENGTH = 6;

/** Short enough to limit replay, long enough to switch to a mail client. */
export const OTP_TTL_MS = 5 * 60 * 1000;

/** Wrong codes before the challenge dies. Bounds brute force at 3 in 10^6. */
export const OTP_MAX_ATTEMPTS = 3;

/* Login throttling: the mitigation for the enumeration trade-off in
   DECISIONS.md §14. "No account with that email" is only cheap to exploit if an
   attacker can probe quickly, so probing is made slow. */

/** Failed attempts per email address before the endpoint starts refusing. */
export const LOGIN_MAX_ATTEMPTS = 5;

/** Rolling window over which those attempts are counted. */
export const LOGIN_RATE_WINDOW_MS = 60 * 1000;

/* -------------------------------------------------------------------------
   Mock transport
   ------------------------------------------------------------------------- */

/** A mock that answers instantly hides every loading state, so they never get
 *  designed or tested. Skipped under MODE=test. */
export const MOCK_LATENCY_MS = { min: 420, max: 900 } as const;

/* -------------------------------------------------------------------------
   Client storage keys
   ------------------------------------------------------------------------- */

/** sessionStorage rather than localStorage: it dies with the tab, as a session
 *  should. Only the authenticated state is written; a live challenge never is,
 *  because a half-completed authentication surviving a refresh is exactly what
 *  a second factor exists to prevent. */
export const SESSION_STORAGE_KEY = "alkira.session";

/** localStorage: unlike a session, a display preference should outlive the tab. */
export const THEME_STORAGE_KEY = "alkira.theme";
