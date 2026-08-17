/**
 * Every tunable value in the application, in one place.
 *
 * These are the numbers a reviewer or a future maintainer will want to find and
 * change: how long a code is valid for, how many attempts are allowed, how slow
 * the mock network pretends to be. Scattered through the codebase as literals
 * they are invisible; collected here they read as policy.
 */

/* -------------------------------------------------------------------------
   One-time passcode policy
   ------------------------------------------------------------------------- */

/** Digits in a generated passcode. */
export const OTP_LENGTH = 6;

/** How long a challenge stays valid. Short enough to limit the replay window,
 *  long enough to survive someone switching to their mail client. */
export const OTP_TTL_MS = 5 * 60 * 1000;

/** Wrong codes allowed before the challenge is destroyed and the user is
 *  returned to the login screen. Bounds brute force at 3 in 10^6. */
export const OTP_MAX_ATTEMPTS = 3;

/** Delay before the resend control becomes available again. Without this,
 *  resend is an unauthenticated way to make the server send mail in a loop. */
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

/* -------------------------------------------------------------------------
   Login throttling

   This is the mitigation for the enumeration trade-off recorded in
   DECISIONS.md section 14. Specific error messages ("no account with that
   email") are only cheap to exploit if an attacker can probe quickly, so
   probing is made slow.
   ------------------------------------------------------------------------- */

/** Failed attempts per email address before the endpoint starts refusing. */
export const LOGIN_MAX_ATTEMPTS = 5;

/** Rolling window over which those attempts are counted. */
export const LOGIN_RATE_WINDOW_MS = 60 * 1000;

/* -------------------------------------------------------------------------
   Mock transport
   ------------------------------------------------------------------------- */

/** Artificial latency, in milliseconds, applied to every mock response.
 *  A mock that answers instantly hides every loading state, which means the
 *  loading states never get designed and never get tested. */
export const MOCK_LATENCY_MS = { min: 420, max: 900 } as const;

/* -------------------------------------------------------------------------
   Client storage keys
   ------------------------------------------------------------------------- */

/** sessionStorage key for the authenticated session.
 *
 *  sessionStorage rather than localStorage: it dies with the tab, which is what
 *  a session should do, and it is not shared across tabs.
 *
 *  Only the authenticated state is ever written here. The pre-MFA challenge is
 *  deliberately never persisted, because a half-completed authentication
 *  surviving a page refresh is precisely what a second factor exists to
 *  prevent. */
export const SESSION_STORAGE_KEY = "alkira.session";

/** localStorage key for the theme choice. Unlike the session this *should*
 *  outlive the tab: a display preference is not a credential. */
export const THEME_STORAGE_KEY = "alkira.theme";
