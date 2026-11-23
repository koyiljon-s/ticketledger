"use client";

import Image from "next/image";
import { accountOf, nameOf, shortHash } from "@/lib/chain/accounts";
import type { Address, ShowEvent } from "@/lib/chain/types";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-sm text-zinc-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "light"; size?: "sm" | "md" | "lg" }) {
  const styles = {
    primary: "bg-violet-600 text-white hover:bg-violet-700",
    ghost: "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    light: "bg-white text-zinc-900 hover:bg-zinc-100",
  }[variant];
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" }[size];
  return (
    <button
      {...props}
      className={`rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${sizes} ${className}`}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-violet-500 ${props.className ?? ""}`}
    />
  );
}

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-1 block text-xs font-semibold text-zinc-700">
      {children}
      {hint && <span className="ml-1 font-normal text-zinc-500">({hint})</span>}
    </span>
  );
}

export function Hash({ value, chars = 6, className = "" }: { value: string; chars?: number; className?: string }) {
  return (
    <code title={value} className={`font-mono text-xs text-zinc-500 ${className}`}>
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

export function Badge({ children, color = "zinc" }: { children: React.ReactNode; color?: "zinc" | "green" | "red" | "amber" | "violet" | "sky" }) {
  const c = {
    zinc: "bg-zinc-100 text-zinc-700",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-rose-100 text-rose-800",
    amber: "bg-amber-100 text-amber-800",
    violet: "bg-violet-100 text-violet-800",
    sky: "bg-sky-100 text-sky-800",
  }[color];
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${c}`}>{children}</span>;
}

export function Tix({ amount, className = "" }: { amount: number; className?: string }) {
  return (
    <span className={`font-bold tabular-nums ${className}`}>
      {amount.toLocaleString()} <span className="text-[0.75em] font-medium text-zinc-500">TIX</span>
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
  Concert: "from-fuchsia-600 to-violet-800",
  Festival: "from-amber-500 to-rose-600",
  Sports: "from-emerald-500 to-teal-800",
  Theatre: "from-rose-600 to-red-900",
  eSports: "from-sky-500 to-indigo-800",
  Film: "from-orange-500 to-amber-800",
};

/** Event artwork: the imported image if there is one, otherwise a category gradient. */
export function EventArt({
  ev,
  className = "",
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
}: {
  ev: Pick<ShowEvent, "category" | "imageUrl" | "name">;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${CATEGORY_GRADIENT[ev.category]} ${className}`}>
      {ev.imageUrl ? (
        // Remote images are shown as-is (unoptimized) so any CDN host works without config.
        <Image src={ev.imageUrl} alt={ev.name} fill unoptimized priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-6xl opacity-80">{CATEGORY_EMOJI[ev.category]}</div>
      )}
    </div>
  );
}

function parseDate(d: string) {
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(d: string) {
  const date = parseDate(d);
  if (!date) return d || "Date TBA";
  const hasTime = d.includes("T");
  return date.toLocaleString(undefined, hasTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

/** Calendar-style date column used in event list rows. */
export function DateBlock({ date }: { date: string }) {
  const d = parseDate(date);
  if (!d) return <div className="w-16 shrink-0 text-center text-xs font-semibold text-zinc-500">TBA</div>;
  return (
    <div className="w-16 shrink-0 text-center">
      <div className="text-xs font-bold uppercase text-violet-700">{d.toLocaleString(undefined, { month: "short" })}</div>
      <div className="text-3xl font-extrabold leading-none text-zinc-900">{d.getDate()}</div>
      <div className="mt-1 text-[11px] text-zinc-500">{d.toLocaleString(undefined, { weekday: "short" })}</div>
    </div>
  );
}

export function timeOf(date: string) {
  const d = parseDate(date);
  if (!d || !date.includes("T")) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-zinc-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      <p className="text-sm">Mining genesis block…</p>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">{children}</div>;
}
