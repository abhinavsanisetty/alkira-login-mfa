import { cn } from "@/lib/cn";

/**
 * The complete icon set.
 *
 * Hand-drawn on a 24 unit grid rather than pulled from a library, for three
 * reasons: an icon dependency is a lot of weight for eleven glyphs, every glyph
 * here can be held to the same 1.5 stroke and the same rounded joins, and the
 * set stays closed. Nobody can casually introduce a filled or two-tone icon,
 * because there is nowhere to import one from.
 *
 * Every glyph is monochrome and inherits currentColor, so an icon takes the
 * colour of whatever text it sits beside. In practice that means grey for
 * metadata and royal blue for actions, decided by the parent rather than baked
 * in here. No fills, no gradients, no skeuomorphism, and no emoji anywhere in
 * the interface.
 *
 * Icons are decorative by default and hidden from assistive technology. Every
 * control that uses one also carries a text label or an aria-label, so nothing
 * here is load-bearing for meaning.
 */

const PATHS = {
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  shield: <path d="M12 3.5 5 6v5.5c0 4 3 7.4 7 9 4-1.6 7-5 7-9V6l-7-2.5Z" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.5 6.5 7.4 20a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9l.9-13.5" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14.5 6.5 3 3" />
    </>
  ),
  exit: (
    <>
      <path d="M15 4.5h3.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M10 8.5 6 12l4 3.5M6 12h9" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5M12 16h.01" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  className?: string;
  /** Supply only when the icon is the sole content of a control and no text
   *  label accompanies it. Anything else stays decorative. */
  label?: string;
}

export function Icon({ name, className, label }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-4 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {PATHS[name]}
    </svg>
  );
}
