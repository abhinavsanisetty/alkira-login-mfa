import { useSyncExternalStore } from "react";

import { inbox } from "@/mocks/inbox";

/**
 * A stand-in for the channel a real code would arrive on.
 *
 * Its purpose is to make the out-of-band boundary visible rather than asserted:
 * the code arrives somewhere other than the form, and a resend visibly
 * supersedes the previous one. Replacing this with a real mailer would not touch
 * generation or verification. See DECISIONS.md §8.
 */
export function MockInbox() {
  const messages = useSyncExternalStore(inbox.subscribe, inbox.snapshot);

  return (
    <aside
      aria-label="Development inbox"
      className="w-full rounded-sm border border-dashed border-rule-strong bg-sunk p-4 lg:w-64"
    >
      <p className="text-2xs font-medium uppercase tracking-[0.07em] text-gray">
        Dev inbox &mdash; not part of the product
      </p>

      {messages.length === 0 ? (
        <p className="mt-3 text-sm text-gray">No messages.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {messages.map((message) => (
            <li
              key={message.id}
              className="animate-arrive rounded-sm border border-rule bg-surface p-3"
            >
              <p className="text-xs text-gray">To {message.email}</p>
              <p
                data-numeric
                className={
                  message.superseded
                    ? "mt-1 font-mono text-lg text-gray line-through"
                    : "mt-1 font-mono text-lg tracking-[0.2em] text-ink"
                }
              >
                {message.code}
              </p>
              {message.superseded ? (
                <p className="mt-0.5 text-2xs text-gray">Superseded by a newer code</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
