"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ORGANIZER } from "@/lib/chain/accounts";
import type { EventCategory } from "@/lib/chain/types";
import type { TmEvent, TmSearchResult } from "@/lib/ticketmaster";
import { useChain } from "../chain-provider";
import { byDate, Container, eventHref } from "../event-parts";
import { Badge, Button, Card, DateBlock, Input, Label, PageHeader, Select } from "../ui";

const SEGMENTS = [
  { value: "", label: "All categories" },
  { value: "Music", label: "Music" },
  { value: "Sports", label: "Sports" },
  { value: "Arts & Theatre", label: "Arts & Theatre" },
  { value: "Film", label: "Film" },
  { value: "Miscellaneous", label: "Miscellaneous" },
];

const COUNTRIES = [
  ["", "Any country"],
  ["US", "United States"],
  ["GB", "United Kingdom"],
  ["CA", "Canada"],
  ["DE", "Germany"],
  ["FR", "France"],
  ["ES", "Spain"],
  ["NL", "Netherlands"],
  ["AU", "Australia"],
  ["AE", "United Arab Emirates"],
  ["TR", "Türkiye"],
];

type Rules = { price: number; supply: number; royaltyPct: number; markupPct: number };
const DEFAULT_RULES: Rules = { price: 100, supply: 50, royaltyPct: 10, markupPct: 10 };

export function OrganizerView() {
  const { pendingState, account, setAccount } = useChain();
  const isOrganizer = account === ORGANIZER;
  const myEvents = Object.values(pendingState.events)
    .filter((e) => e.organizer === ORGANIZER)
    .sort(byDate);
  const sold = myEvents.reduce((s, e) => s + e.sold, 0);
  const revenue = myEvents.reduce((s, e) => s + e.primaryRevenue, 0);
  const royalties = myEvents.reduce((s, e) => s + e.royaltiesEarned, 0);

  return (
    <Container className="space-y-10">
      <PageHeader
        title="🎤 Organizer dashboard"
        subtitle="Import real events from Ticketmaster, then mint them on StageChain with your own resale cap and royalty. The event details are real; the tickets are demo tokens."
      />

      {!isOrganizer && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50 text-sm">
          <span className="text-amber-900">
            You are not the verified organizer. You can search, but minting will be <b>reverted</b> by the contract.
          </span>
          <Button variant="ghost" onClick={() => setAccount(ORGANIZER)}>
            Switch to 🎤 Aurora Live
          </Button>
        </Card>
      )}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Events", myEvents.length],
          ["Tickets sold", sold],
          ["Primary revenue", `${revenue} TIX`],
          ["Resale royalties", `${royalties} TIX`],
        ].map(([k, v]) => (
          <Card key={k as string}>
            <div className="text-xs font-semibold uppercase text-zinc-500">{k}</div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums">{v}</div>
          </Card>
        ))}
      </section>

      <TicketmasterImport />

      <section>
        <h2 className="mb-3 text-xl font-extrabold">Your events</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Face</th>
                <th className="px-4 py-3">Royalty</th>
                <th className="px-4 py-3">Earned</th>
              </tr>
            </thead>
            <tbody>
              {myEvents.map((e) => (
                <tr key={e.id} className="border-t border-zinc-100">
                  <td className="px-4 py-2.5">
                    <Link href={eventHref(e)} className="font-semibold hover:text-violet-700">
                      {e.name}
                    </Link>
                    <div className="font-mono text-[11px] text-zinc-500">{e.id}</div>
                  </td>
                  <td className="px-4 py-2.5">{e.source ? <Badge color="sky">Ticketmaster</Badge> : <Badge>Manual</Badge>}</td>
                  <td className="px-4 py-2.5">
                    {e.sold}/{e.supply}
                  </td>
                  <td className="px-4 py-2.5">{e.price}</td>
                  <td className="px-4 py-2.5">{e.royaltyBps / 100}%</td>
                  <td className="px-4 py-2.5 font-semibold text-emerald-700">{e.primaryRevenue + e.royaltiesEarned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section>
        <h2 className="mb-1 text-xl font-extrabold">Create an event manually</h2>
        <p className="mb-4 text-sm text-zinc-600">Works offline. Useful as a fallback if the API is unavailable during a presentation.</p>
        <CreateEventForm />
      </section>
    </Container>
  );
}

// ── Ticketmaster import ───────────────────────────────────────────────────

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; code: string; message: string }
  | { status: "done"; result: TmSearchResult };

function TicketmasterImport() {
  const [keyword, setKeyword] = useState("");
  const [segment, setSegment] = useState("Music");
  const [country, setCountry] = useState("US");
  const [page, setPage] = useState(0);
  const [state, setState] = useState<FetchState>({ status: "idle" });

  async function search(p = 0) {
    setPage(p);
    setState({ status: "loading" });
    const qs = new URLSearchParams({ keyword, segment, countryCode: country, page: String(p) });
    try {
      const res = await fetch(`/api/ticketmaster/events?${qs}`);
      const data = await res.json();
      if (!res.ok) setState({ status: "error", code: data.error ?? "error", message: data.message ?? `HTTP ${res.status}` });
      else setState({ status: "done", result: data as TmSearchResult });
    } catch (e) {
      setState({ status: "error", code: "network", message: String(e) });
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xl font-extrabold">Import from Ticketmaster</h2>
        <Badge color="sky">Discovery API</Badge>
      </div>
      <Card className="p-0">
        <form
          className="grid gap-3 border-b border-zinc-200 p-5 md:grid-cols-[1fr_200px_200px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            void search(0);
          }}
        >
          <label>
            <Label>Artist, team or event</Label>
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. Coldplay, NBA, Hamilton" />
          </label>
          <label>
            <Label>Category</Label>
            <Select value={segment} onChange={(e) => setSegment(e.target.value)}>
              {SEGMENTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <Label>Country</Label>
            <Select value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map(([c, n]) => (
                <option key={c} value={c}>
                  {n}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={state.status === "loading"} className="w-full">
              {state.status === "loading" ? "Searching…" : "Search"}
            </Button>
          </div>
        </form>

        {state.status === "idle" && <p className="p-6 text-sm text-zinc-500">Search Ticketmaster for real upcoming events to bring on-chain.</p>}
        {state.status === "loading" && <p className="p-6 text-sm text-zinc-500">Loading events from Ticketmaster…</p>}
        {state.status === "error" &&
          (state.code === "missing_key" ? (
            <div className="space-y-2 p-6 text-sm">
              <div className="font-bold">Ticketmaster API key not configured</div>
              <ol className="list-decimal space-y-1 pl-5 text-zinc-700">
                <li>
                  Create a free account at{" "}
                  <a className="text-violet-700 underline" href="https://developer.ticketmaster.com/" target="_blank" rel="noreferrer">
                    developer.ticketmaster.com
                  </a>{" "}
                  and copy your <b>Consumer Key</b>.
                </li>
                <li>
                  Copy <code>.env.example</code> to <code>.env.local</code> and set <code>TICKETMASTER_API_KEY=…</code>
                </li>
                <li>Restart the dev server.</li>
              </ol>
              <p className="text-zinc-500">Until then you can still create events manually below.</p>
            </div>
          ) : (
            <p className="p-6 text-sm text-rose-700">⚠️ {state.message}</p>
          ))}
        {state.status === "done" && (
          <>
            {state.result.events.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">No events found. Try another keyword or country.</p>
            ) : (
              state.result.events.map((e) => <TmRow key={e.id} e={e} />)
            )}
            {state.result.page.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-3 text-sm">
                <span className="text-zinc-500">
                  Page {page + 1} of {Math.min(state.result.page.totalPages, 50)} · {state.result.page.totalElements.toLocaleString()} events
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => void search(page - 1)}>
                    ← Prev
                  </Button>
                  <Button size="sm" variant="ghost" disabled={page + 1 >= Math.min(state.result.page.totalPages, 50)} onClick={() => void search(page + 1)}>
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
      <p className="mt-2 text-xs text-zinc-500">Event data © Ticketmaster and/or event organizers. Results are cached for about an hour.</p>
    </section>
  );
}

function TmRow({ e }: { e: TmEvent }) {
  const { pendingState, submit } = useChain();
  const existing = Object.values(pendingState.events).find((x) => x.source?.provider === "ticketmaster" && x.source.id === e.id);
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<Rules>(() => ({
    ...DEFAULT_RULES,
    price: e.priceMin ? Math.max(1, Math.round(e.priceMin)) : DEFAULT_RULES.price,
  }));
  const [busy, setBusy] = useState(false);
  const place = [e.venue, e.city, e.country].filter(Boolean).join(", ");

  async function mint() {
    setBusy(true);
    const r = await submit("CREATE_EVENT", {
      name: e.name,
      venue: place || "Venue TBA",
      date: e.date,
      category: e.category,
      price: Math.round(rules.price),
      supply: Math.round(rules.supply),
      royaltyBps: Math.round(rules.royaltyPct * 100),
      maxMarkupBps: Math.round(rules.markupPct * 100),
      ...(e.image ? { imageUrl: e.image } : {}),
      source: { provider: "ticketmaster", id: e.id, url: e.url },
    });
    setBusy(false);
    if (r.ok) setOpen(false);
  }

  return (
    <div className="border-b border-zinc-100 last:border-b-0">
      <div className="flex items-center gap-4 px-5 py-3">
        <DateBlock date={e.date} />
        <div className="relative hidden h-14 w-24 shrink-0 overflow-hidden rounded bg-zinc-200 sm:block">
          {e.image && <Image src={e.image} alt="" fill unoptimized sizes="96px" className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{e.name}</div>
          <div className="truncate text-sm text-zinc-600">{place || "Venue TBA"}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {e.genre && <Badge>{e.genre}</Badge>}
            {e.priceMin !== null && (
              <Badge color="amber">
                Real price {e.priceMin}
                {e.priceMax && e.priceMax !== e.priceMin ? `–${e.priceMax}` : ""} {e.currency}
              </Badge>
            )}
            {e.status && e.status !== "onsale" && <Badge color="red">{e.status}</Badge>}
            <a href={e.url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-violet-700 hover:underline">
              Ticketmaster ↗
            </a>
          </div>
        </div>
        {existing ? (
          <Link href={eventHref(existing)} className="shrink-0 text-sm font-semibold text-emerald-700 hover:underline">
            ✓ On-chain as {existing.id}
          </Link>
        ) : (
          <Button size="sm" variant={open ? "ghost" : "primary"} onClick={() => setOpen((o) => !o)}>
            {open ? "Cancel" : "Import"}
          </Button>
        )}
      </div>
      {open && !existing && (
        <div className="grid gap-3 bg-violet-50 px-5 py-4 sm:grid-cols-5">
          <RuleInput label="Face value (TIX)" value={rules.price} onChange={(v) => setRules({ ...rules, price: v })} min={1} />
          <RuleInput label="Supply" value={rules.supply} onChange={(v) => setRules({ ...rules, supply: v })} min={1} max={500} />
          <RuleInput label="Royalty %" value={rules.royaltyPct} onChange={(v) => setRules({ ...rules, royaltyPct: v })} min={0} max={25} step={0.5} />
          <RuleInput label="Max resale markup %" value={rules.markupPct} onChange={(v) => setRules({ ...rules, markupPct: v })} min={0} max={100} />
          <div className="flex items-end">
            <Button disabled={busy} onClick={() => void mint()} className="w-full">
              ⛓ Mint on StageChain
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RuleInput({ label, value, onChange, ...rest }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <label>
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} {...rest} />
    </label>
  );
}

// ── Manual creation ──────────────────────────────────────────────────────

const CATEGORIES: EventCategory[] = ["Concert", "Festival", "Sports", "Theatre", "eSports", "Film"];

function CreateEventForm() {
  const { submit } = useChain();
  const [form, setForm] = useState({
    name: "Neon Nights Festival",
    venue: "Central Park Stage",
    date: "2027-06-21T18:00",
    category: "Festival" as EventCategory,
    price: 80,
    supply: 30,
    royaltyPct: 10,
    markupPct: 10,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card>
      <form
        className="grid gap-4 md:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          await submit("CREATE_EVENT", {
            name: form.name,
            venue: form.venue,
            date: form.date,
            category: form.category,
            price: Math.round(form.price),
            supply: Math.round(form.supply),
            royaltyBps: Math.round(form.royaltyPct * 100),
            maxMarkupBps: Math.round(form.markupPct * 100),
          });
        }}
      >
        <label className="md:col-span-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label>
          <Label>Venue</Label>
          <Input value={form.venue} onChange={(e) => set("venue", e.target.value)} />
        </label>
        <label>
          <Label>Date</Label>
          <Input type="datetime-local" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </label>
        <label>
          <Label>Category</Label>
          <Select value={form.category} onChange={(e) => set("category", e.target.value as EventCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </label>
        <RuleInput label="Face value (TIX)" value={form.price} onChange={(v) => set("price", v)} min={1} />
        <RuleInput label="Supply" value={form.supply} onChange={(v) => set("supply", v)} min={1} max={500} />
        <RuleInput label="Royalty %" value={form.royaltyPct} onChange={(v) => set("royaltyPct", v)} min={0} max={25} step={0.5} />
        <RuleInput label="Max resale markup %" value={form.markupPct} onChange={(v) => set("markupPct", v)} min={0} max={100} />
        <div className="flex items-end md:col-span-3">
          <Button type="submit">Deploy event on-chain</Button>
        </div>
      </form>
    </Card>
  );
}
