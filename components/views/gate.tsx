"use client";

import { useState } from "react";
import { ACCOUNTS, ORGANIZER } from "@/lib/chain/accounts";
import { useChain } from "../chain-provider";
import { Container } from "../event-parts";
import { Badge, Button, Card, Hash, Input, Label, PageHeader, Who } from "../ui";

export function GateView() {
  const { state, pendingState, submit, account, setAccount, mempool } = useChain();
  const [ticketId, setTicketId] = useState("EVT-1#1");
  const [claimed, setClaimed] = useState(ACCOUNTS[1].address as string);
  const [checked, setChecked] = useState<string | null>(null);

  const isOrganizer = account === ORGANIZER;
  const id = checked;
  const t = id ? state.tickets[id] : undefined; // verify against *final* (mined) state only
  const ev = t ? state.events[t.eventId] : undefined;
  const pendingCheckIn = id ? mempool.some((tx) => tx.type === "CHECK_IN" && tx.payload.ticketId === id) : false;

  let verdict: { ok: boolean; reason: string } | null = null;
  if (id) {
    if (!t) verdict = { ok: false, reason: "Token does not exist on-chain. This ticket is counterfeit." };
    else if (t.usedAt !== null) verdict = { ok: false, reason: `Already checked in at ${new Date(t.usedAt).toLocaleTimeString()}. Duplicate entry attempt.` };
    else if (t.owner !== claimed) verdict = { ok: false, reason: "The person at the gate is not the on-chain owner. The ticket may be stolen or a screenshot." };
    else verdict = { ok: true, reason: "Valid ticket held by the presenting wallet." };
  }

  const upcoming = Object.values(pendingState.tickets).filter((x) => x.usedAt === null);

  return (
    <Container>
      <PageHeader
        title="Gate Check-in"
        subtitle="Venue staff scan the fan's ticket. The scanner reads the blockchain to confirm the token exists, is owned by the presenting wallet and has not been used. Admitting the fan writes a CHECK_IN transaction, so the ticket can never be reused."
      />
      {!isOrganizer && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-amber-300 bg-amber-50 text-sm">
          <span>Only the organizer&apos;s scanner can write CHECK_IN transactions. Anyone can still verify a ticket.</span>
          <Button variant="ghost" onClick={() => setAccount(ORGANIZER)}>
            Switch to 🎤 Aurora Live
          </Button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setChecked(ticketId.trim());
            }}
          >
            <label className="block">
              <Label hint="from the fan's QR code">Ticket token ID</Label>
              <Input value={ticketId} onChange={(e) => setTicketId(e.target.value)} className="font-mono" />
            </label>
            <label className="block">
              <Label hint="the wallet that signs the QR challenge">Presenting wallet</Label>
              <select
                value={claimed}
                onChange={(e) => setClaimed(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                {ACCOUNTS.map((a) => (
                  <option key={a.address} value={a.address}>
                    {a.emoji} {a.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">🔍 Verify on-chain</Button>
              <Button type="button" variant="ghost" onClick={() => setTicketId("EVT-1#999")}>
                Try a fake ticket
              </Button>
            </div>
          </form>

          {upcoming.length > 0 && (
            <div className="mt-6">
              <Label>Unused tickets (quick pick)</Label>
              <div className="flex flex-wrap gap-1.5">
                {upcoming.slice(0, 16).map((x) => (
                  <button
                    key={x.id}
                    onClick={() => {
                      setTicketId(x.id);
                      setClaimed(x.owner);
                    }}
                    className="rounded-md border border-zinc-200 px-2 py-1 font-mono text-[11px] text-zinc-700 hover:border-violet-500"
                  >
                    {x.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className={verdict ? (verdict.ok ? "border-emerald-400" : "border-rose-400") : ""}>
          {!verdict ? (
            <div className="grid h-full place-items-center py-16 text-sm text-zinc-500">Scan a ticket to verify it</div>
          ) : (
            <div className="space-y-4">
              <div className={`text-5xl ${verdict.ok ? "" : "grayscale"}`}>{verdict.ok ? "✅" : "⛔"}</div>
              <div>
                <div className={`text-2xl font-bold ${verdict.ok ? "text-emerald-700" : "text-rose-700"}`}>
                  {verdict.ok ? "ENTRY ALLOWED" : "ENTRY DENIED"}
                </div>
                <p className="mt-1 text-sm text-zinc-600">{verdict.reason}</p>
              </div>
              {t && ev && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-zinc-500">Event</dt>
                  <dd>{ev.name}</dd>
                  <dt className="text-zinc-500">Token</dt>
                  <dd className="font-mono">{t.id}</dd>
                  <dt className="text-zinc-500">On-chain owner</dt>
                  <dd>
                    <Who address={t.owner} />
                  </dd>
                  <dt className="text-zinc-500">Minted in tx</dt>
                  <dd>
                    <Hash value={t.history[0].txHash} /> (block #{t.history[0].block})
                  </dd>
                  <dt className="text-zinc-500">Transfers</dt>
                  <dd>{t.history.length - 1}</dd>
                </dl>
              )}
              {verdict.ok && (
                <div className="flex items-center gap-3">
                  <Button disabled={pendingCheckIn} onClick={() => void submit("CHECK_IN", { ticketId: t!.id })}>
                    Admit & record check-in
                  </Button>
                  {pendingCheckIn && <Badge color="amber">check-in pending — waiting for block</Badge>}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </Container>
  );
}
