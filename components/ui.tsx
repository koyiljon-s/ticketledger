"use client";

import { accountOf, nameOf, shortHash } from "@/lib/chain/accounts";
import type { Address } from "@/lib/chain/types";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-zinc-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white hover:brightness-110",
    ghost: "border border-white/15 text-zinc-200 hover:bg-white/5",
    danger: "bg-rose-500/90 text-white hover:bg-rose-500",
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-fuchsia-400 ${props.className ?? ""}`}
    />
  );
}

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-400">
      {children}
      {hint && <span className="ml-1 normal-case tracking-normal text-zinc-500">— {hint}</span>}
    </span>
  );
}

export function Hash({ value, chars = 6, className = "" }: { value: string; chars?: number; className?: string }) {
  return (
    <code title={value} className={`font-mono text-xs text-zinc-400 ${className}`}>
      {shortHash(value, chars)}
    </code>
  );
}

export function Who({ address }: { address: Address | null }) {
  const acc = accountOf(address);
  return (
    <span className="inline-flex items-center gap-1" title={address ?? ""}>
      {acc && <span>{acc.emoji}</span>}
      <span>{nameOf(address)}</span>
    </span>
  );
}

export function Badge({ children, color = "zinc" }: { children: React.ReactNode; color?: "zinc" | "green" | "red" | "amber" | "fuchsia" | "sky" }) {
  const c = {
    zinc: "bg-zinc-500/15 text-zinc-300",
    green: "bg-emerald-500/15 text-emerald-300",
    red: "bg-rose-500/15 text-rose-300",
    amber: "bg-amber-500/15 text-amber-300",
    fuchsia: "bg-fuchsia-500/15 text-fuchsia-300",
    sky: "bg-sky-500/15 text-sky-300",
  }[color];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${c}`}>{children}</span>;
}

export function Tix({ amount }: { amount: number }) {
  return (
    <span className="font-semibold tabular-nums">
      {amount.toLocaleString()} <span className="text-xs font-normal text-zinc-400">TIX</span>
    </span>
  );
}

export const CATEGORY_EMOJI: Record<string, string> = {
  Concert: "🎤",
  Festival: "🎪",
  Sports: "🏟️",
  Theatre: "🎭",
  eSports: "🎮",
  Film: "🎬",
};

export const CATEGORY_GRADIENT: Record<string, string> = {
  Concert: "from-fuchsia-600 to-violet-700",
  Festival: "from-amber-500 to-rose-600",
  Sports: "from-emerald-500 to-teal-700",
  Theatre: "from-rose-600 to-red-800",
  eSports: "from-sky-500 to-indigo-700",
  Film: "from-orange-500 to-yellow-700",
};

export function formatDate(d: string) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-zinc-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
      <p className="text-sm">Mining genesis block…</p>
    </div>
  );
}
