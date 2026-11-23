"use client";

import { useState } from "react";
import { ORGANIZER } from "@/lib/chain/accounts";
import { maxResalePrice } from "@/lib/chain/contract";
import type { EventCategory, ShowEvent } from "@/lib/chain/types";
import { useChain } from "../chain-provider";
import { Badge, Button, CATEGORY_EMOJI, CATEGORY_GRADIENT, Card, formatDate, Input, Label, PageHeader, Tix, Who } from "../ui";

export function EventsView() {
  const { pendingState, account } = useChain();
  const events = Object.values(pendingState.events).reverse();
  const isOrganizer = account === ORGANIZER;

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Primary sales. Buying a ticket sends a BUY_TICKET transaction. The contract takes payment, pays the organizer and mints a unique ticket token to your address."
      />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {events.map((ev) => (
          <EventCard key={ev.id} ev={ev} />
        ))}
      </div>

      <div className="mt-12">
        <h2 className="mb-1 text-xl font-semibold">Create an event</h2>
        <p className="mb-4 text-sm text-zinc-400">
          {isOrganizer
            ? "You are the verified organizer. The rules you set here become immutable on-chain."
            : "Only the verified organizer (Aurora Live) may create events. Try submitting anyway to see the contract revert."}
        </p>
        <CreateEventForm />
      </div>
    </>
  );
}

function EventCard({ ev }: { ev: ShowEvent }) {
  const { submit, pendingState, account } = useChain();
  const [busy, setBusy] = useState(false);
  const left = ev.supply - ev.sold;
  const owned = Object.values(pendingState.tickets).filter((t) => t.eventId === ev.id && t.owner === account).length;

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <div className={`relative h-32 bg-gradient-to-br ${CATEGORY_GRADIENT[ev.category]} p-4`}>
        <div className="absolute right-4 top-3 text-5xl opacity-70">{CATEGORY_EMOJI[ev.category]}</div>
        <Badge color="zinc">{ev.category}</Badge>
        <div className="mt-6 pr-14 text-lg font-bold leading-tight drop-shadow">{ev.name}</div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 text-sm">
        <div className="text-zinc-400">
          📍 {ev.venue}
          <br />
          🗓️ {formatDate(ev.date)}
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-black/30 p-3 text-center text-xs">
          <div>
            <div className="text-zinc-500">Face value</div>
            <div className="mt-0.5 text-sm font-semibold">{ev.price}</div>
          </div>
          <div>
            <div className="text-zinc-500">Resale cap</div>
            <div className="mt-0.5 text-sm font-semibold">{maxResalePrice(ev.price, ev.maxMarkupBps)}</div>
          </div>
          <div>
            <div className="text-zinc-500">Royalty</div>
            <div className="mt-0.5 text-sm font-semibold">{ev.royaltyBps / 100}%</div>
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-zinc-400">
            <span>
              {ev.sold}/{ev.supply} sold
            </span>
            <span>{left} left</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-fuchsia-400" style={{ width: `${(ev.sold / ev.supply) * 100}%` }} />
          </div>
        </div>
        <div className="text-xs text-zinc-500">
          {ev.id} · by <Who address={ev.organizer} />
          {owned > 0 && <span className="ml-2 text-emerald-300">· you own {owned}</span>}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <Tix amount={ev.price} />
          <Button
            disabled={busy || left === 0}
            onClick={async () => {
              setBusy(true);
              await submit("BUY_TICKET", { eventId: ev.id });
              setBusy(false);
            }}
          >
            {left === 0 ? "Sold out" : "Buy ticket"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

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
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as EventCategory)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} className="bg-zinc-900">
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          <Label>Face value (TIX)</Label>
          <Input type="number" min={1} value={form.price} onChange={(e) => set("price", Number(e.target.value))} />
        </label>
        <label>
          <Label>Supply</Label>
          <Input type="number" min={1} max={500} value={form.supply} onChange={(e) => set("supply", Number(e.target.value))} />
        </label>
        <label>
          <Label hint="0–25">Resale royalty %</Label>
          <Input type="number" min={0} max={25} step={0.5} value={form.royaltyPct} onChange={(e) => set("royaltyPct", Number(e.target.value))} />
        </label>
        <label>
          <Label hint="anti-scalping">Max resale markup %</Label>
          <Input type="number" min={0} max={100} value={form.markupPct} onChange={(e) => set("markupPct", Number(e.target.value))} />
        </label>
        <div className="flex items-end md:col-span-3">
          <Button type="submit">Deploy event on-chain</Button>
        </div>
      </form>
    </Card>
  );
}
