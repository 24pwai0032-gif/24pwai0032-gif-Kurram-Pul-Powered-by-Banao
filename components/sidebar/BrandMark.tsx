/**
 * Kurram Pul's mark: a bridge ("pul") in two strokes, drawn side-on like a stone footbridge:
 * the deck rising over the river, and the arch opening beneath it. Brand clay, line-based like
 * the interface icons; no tile, no ornament.
 */
export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`shrink-0 text-brand ${size === "sm" ? "size-6" : "size-8"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 15h3c1.6-4.2 4-6.3 7-6.3s5.4 2.1 7 6.3h3" />
      <path d="M7.5 19a4.5 4.5 0 0 1 9 0" />
    </svg>
  );
}
