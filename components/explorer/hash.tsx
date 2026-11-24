"use client";

import { useState } from "react";

export type HashColors = Map<string, number>;

/** Gives every distinct hash its own hue. Golden-angle steps keep neighbours far apart. */
export function assignColors(hashes: string[]): HashColors {
  return new Map([...new Set(hashes)].map((h, i) => [h, (i * 137.5 + 200) % 360]));
}

function styleFor(hash: string, colors: HashColors) {
  const hue = colors.get(hash);
  if (hue === undefined) return { backgroundColor: "#e4e4e7", color: "#3f3f46" };
  return { backgroundColor: `hsl(${hue} 85% 88%)`, color: `hsl(${hue} 80% 20%)` };
}

/** Strong colour for the edges of a block on the map. */
export function hashTint(hash: string, colors: HashColors) {
  const hue = colors.get(hash);
  return hue === undefined ? "#a1a1aa" : `hsl(${hue} 75% 50%)`;
}

/** Short, colour-coded hash. */
export function HashChip({ hash, colors }: { hash: string; colors: HashColors }) {
  return (
    <code title={hash} style={styleFor(hash, colors)} className="inline-block rounded px-1.5 py-0.5 font-mono text-xs font-bold">
      {hash.slice(0, 4)}…{hash.slice(-6)}
    </code>
  );
}

/** Full value with a copy button. */
export function CopyValue({ value, label, colors }: { value: string; label: string; colors?: HashColors }) {
  const [result, setResult] = useState<"copied" | "failed" | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setResult("copied");
    } catch {
      setResult("failed");
    }
    setTimeout(() => setResult(null), 2000);
  }

  return (
    <span className="flex items-start gap-2">
      <code style={colors ? styleFor(value, colors) : undefined} className="min-w-0 flex-1 rounded px-2 py-1 font-mono text-xs break-all">
        {value}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={`Copy ${label}`}
        className="shrink-0 py-1 text-xs font-bold text-[#024bde] hover:underline"
      >
        <span aria-live="polite">{result === "copied" ? "Copied" : result === "failed" ? "Can't copy" : "Copy"}</span>
      </button>
    </span>
  );
}
