/** Kurram Pul's mark: a bridge ("pul"), on walnut. Functional branding, not ornament. */
export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-lg bg-brand text-on-side ${size === "sm" ? "size-8" : "size-9"}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={size === "sm" ? "size-5" : "size-6"}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
      >
        <path d="M3 17h18" />
        <path d="M5 17c0-5 3.1-8 7-8s7 3 7 8" />
        <path d="M9 17v-4.5M15 17v-4.5" />
      </svg>
    </span>
  );
}
