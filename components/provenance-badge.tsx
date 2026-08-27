import type { ProvenanceTag, TaggedNumber } from "@/lib/types";

const CONFIG: Record<
  ProvenanceTag,
  { label: string; bg: string; fg: string; icon: React.ReactNode }
> = {
  measured: {
    label: "Measured",
    bg: "bg-ink",
    fg: "text-bg",
    icon: (
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
        <path d="M2 6.2 4.8 9 10 3.2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  estimated: {
    label: "Estimated",
    bg: "bg-accent",
    fg: "text-accent-ink",
    icon: (
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
        <path d="M1.5 4.2c1.4-1.4 2.9-1.4 4.2 0 1.3 1.4 2.9 1.4 4.2 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M1.5 7.8c1.4-1.4 2.9-1.4 4.2 0 1.3 1.4 2.9 1.4 4.2 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  scenario: {
    label: "Scenario",
    bg: "bg-slate",
    fg: "text-bg",
    icon: (
      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
        <path d="M2 2h3v3H2zM7 7h3v3H7zM3.5 5v2a1.5 1.5 0 0 0 1.5 1.5H7" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
};

/**
 * Rectangular provenance tag — 1px border, leading icon, tooltip with the
 * one-sentence derivation. Same shape in both themes; only colors invert.
 */
export function ProvenanceBadge({ tag }: { tag: ProvenanceTag }) {
  const c = CONFIG[tag];
  return (
    <span
      className={`inline-flex items-center gap-1 border border-line px-1.5 py-0.5 ${c.bg} ${c.fg}`}
      title={undefined}
      data-tag={tag}
    >
      {c.icon}
      <span className="label-caps text-[10px] leading-none">{c.label}</span>
    </span>
  );
}

/** Renders a number + its provenance badge, with derivation tooltip. */
export function TaggedNumberView({
  number,
  digits = 1,
  prefix = "",
  suffix = "",
  className = "",
}: {
  number: TaggedNumber;
  digits?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const formatted = number.value.toFixed(digits);
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`} title={number.derivation}>
      <span className="font-mono tabular-nums">
        {prefix}
        {formatted}
        {suffix}
      </span>
      <ProvenanceBadge tag={number.tag} />
    </span>
  );
}