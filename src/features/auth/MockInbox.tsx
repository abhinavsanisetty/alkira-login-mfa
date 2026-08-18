import { useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import { inbox } from "@/mocks/inbox";

/**
 * A stand-in for the channel a real code would arrive on.
 *
 * Its purpose is to make the out-of-band boundary visible rather than asserted:
 * the code arrives somewhere other than the form, and a resend visibly
 * supersedes the previous one. Replacing this with a real mailer would not touch
 * generation or verification. See DECISIONS.md §8.
 *
 * The live code is the active item in a list, so it is marked the way every
 * other active list item in the application is marked: a royal edge down the
 * left, not a filled background. Superseded codes keep the plain edge and go
 * grey and struck through, which makes "this one, not that one" readable at a
 * glance rather than something you have to reason about.
 *
 * The dashed border on the panel itself is the one place a dashed line appears,
 * and it is carrying meaning: this section is scaffolding and would not exist in
 * the shipped product.
 */
export function MockInbox() {
  const messages = useSyncExternalStore(inbox.subscribe, inbox.snapshot);

  return (
    <aside
      aria-label="Development inbox"
      className="w-full rounded-sm border border-dashed border-rule-strong bg-sunk p-4 lg:w-64"
    >
      <p className="text-2xs font-semibold uppercase tracking-[0.07em] text-gray">Dev inbox</p>
      <p className="mt-0.5 text-xs text-gray">Not part of the product.</p>

      {messages.length === 0 ? (
        <p className="mt-3 text-sm font-normal text-gray">No messages.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {messages.map((message) => (
            <li
              key={message.id}
              className={cn(
                "rounded-sm border border-l-2 bg-surface p-3",
                message.superseded ? "border-rule border-l-rule-strong" : "border-rule border-l-royal",
              )}
            >
              <p className="text-xs text-gray">To {message.email}</p>
              <p
                data-numeric
                className={cn(
                  "mt-1 font-mono text-lg tracking-[0.2em]",
                  message.superseded ? "text-gray line-through" : "text-ink",
                )}
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
