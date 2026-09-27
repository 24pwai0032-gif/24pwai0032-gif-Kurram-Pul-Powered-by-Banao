"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

/** Heading levels from the model collapse into one small style inside its panel. */
// dir="auto" per block: a mixed answer (an English line inside Urdu text) lays out each line correctly.
const heading: Components["h1"] = ({ children }) => (
  <h3 dir="auto" className="mt-4 text-sm font-semibold text-ink first:mt-0">
    {children}
  </h3>
);

const COMPONENTS: Components = {
  h1: heading,
  h2: heading,
  h3: heading,
  h4: heading,
  p: ({ children }) => (
    <p dir="auto" className="mt-2 first:mt-0">
      {children}
    </p>
  ),
  li: ({ children }) => <li dir="auto">{children}</li>,
  ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1.5 ps-5">{children}</ol>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-1.5 ps-5">{children}</ul>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
      {children}
    </a>
  ),
  // No remote images from model output.
  img: () => null,
  hr: () => <hr className="my-3 border-line" />,
  table: ({ children }) => (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-line px-2 py-1 text-start font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-line px-2 py-1 align-top">{children}</td>,
};

/**
 * Renders LLM output. react-markdown escapes raw HTML, so model text can't inject markup.
 * remark-breaks keeps single line breaks: models often put a heading and its text on
 * consecutive lines, which strict markdown would run together.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={COMPONENTS}>
      {children}
    </ReactMarkdown>
  );
}
