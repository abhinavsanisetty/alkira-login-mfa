/**
 * The mock inbox: the one part of MFA that cannot exist without a backend.
 *
 * MSW handlers run in the page, not inside the service worker, so the "server"
 * can publish here and the MFA screen can subscribe. Swapping this for a real
 * mailer would not touch code generation or verification. See DECISIONS.md §8.
 */

export interface InboxMessage {
  id: string;
  email: string;
  code: string;
  sentAt: number;
  /** Set when a resend supersedes this code, so the UI can show it struck out
   *  rather than silently dropping it. */
  superseded?: boolean;
}

let messages: readonly InboxMessage[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export const inbox = {
  deliver(email: string, code: string) {
    messages = [
      { id: `msg_${Date.now()}_${code}`, email, code, sentAt: Date.now() },
      ...messages.map((m) => (m.email === email ? { ...m, superseded: true } : m)),
    ];
    emit();
  },
  clear() {
    messages = [];
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  snapshot: () => messages,
};
