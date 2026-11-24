"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { EventImage } from "@/components/events/event-image";
import { PhotoCredit } from "@/components/events/photo-credits";
import { ChainError } from "@/components/tickets/chain-error";
import { editEventName, inspectChain, rehashTxs, remine, type BlockReport } from "@/lib/chain/blockchain";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/chain/store";
import type { Block } from "@/lib/chain/types";
import { readEventPhotos } from "@/lib/event-images";
import { AttackProgress, AttackStart } from "./attack-flow";
import { BlockDetail } from "./block-detail";
import { BlockList } from "./block-list";
import { ChainMap } from "./chain-map";
import { assignColors } from "./hash";
import { HealthIcon } from "./icons";
import { artOf, titleOf, type Attack, type ChainView } from "./types";

type Screen = { name: "list" } | { name: "block" | "forge"; index: number } | { name: "attack" };

export function BlockExplorer() {
  const node = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (node.status === "ready") return <Explorer saved={node.chain} />;
  return (
    <>
      <Hero view={null} />
      <div className="mx-auto min-h-80 max-w-384 px-5 py-16">
        {node.status === "error" ? <ChainError message={node.message} /> : <p role="status" className="text-lg text-zinc-600">Checking your blockchain…</p>}
      </div>
    </>
  );
}

function Explorer({ saved }: { saved: Block[] }) {
  const [screen, setScreen] = useState<Screen>({ name: "list" });
  const [attack, setAttack] = useState<Attack | null>(null);
  const [checked, setChecked] = useState<{ chain: Block[]; reports: BlockReport[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panel = useRef<HTMLElement>(null);

  const chain = attack?.chain ?? saved;
  useEffect(() => {
    let current = true;
    void inspectChain(chain).then(({ reports }) => {
      if (current) setChecked({ chain, reports });
    });
    return () => {
      current = false;
    };
  }, [chain]);

  const view: ChainView = {
    chain,
    // Never show results that belong to a different version of the chain.
    reports: checked?.chain === chain ? checked.reports : null,
    // Real hashes come first, so their colours stay the same during an attack.
    colors: assignColors([...saved, ...chain].map((b) => b.hash)),
    photos: readEventPhotos(),
    attack,
  };

  // The chain can be reset from another tab while a later block is open.
  const index = "index" in screen && screen.index < chain.length ? screen.index : null;
  const current: Screen["name"] = screen.name === "attack" ? (attack ? "attack" : "list") : index === null ? "list" : screen.name;

  function open(next: Screen) {
    setScreen(next);
    // On phones the panel sits below the map, so bring it into view.
    if (window.matchMedia("(max-width: 1023px)").matches) panel.current?.scrollIntoView({ block: "start" });
  }

  function start(target: number, name: string) {
    setError(null);
    setAttack({ target, chain: editEventName(saved, target, name), stage: 0, from: titleOf(saved[target]), to: name });
    open({ name: "attack" });
  }

  async function next() {
    if (!attack) return;
    const { target, stage, chain: copy } = attack;
    setBusy(true);
    setError(null);
    try {
      if (stage === 0) setAttack({ ...attack, chain: await rehashTxs(copy, target), stage: 1 });
      else if (stage === 1) setAttack({ ...attack, chain: await remine(copy, target, target), stage: 2 });
      else if (stage === 2) setAttack({ ...attack, chain: await remine(copy, target + 1, copy.length - 1), stage: 3 });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function stop() {
    setError(null);
    setScreen(attack ? { name: "block", index: attack.target } : { name: "list" });
    setAttack(null);
  }

  return (
    <>
      <Hero view={view} />
      <div className="border-b border-zinc-300 lg:grid lg:h-[46rem] lg:grid-cols-[1fr_27.5rem]">
        <ChainMap view={view} selected={current === "attack" ? (attack?.target ?? null) : index} onSelect={(i) => open({ name: "block", index: i })} />
        <aside ref={panel} aria-label="Block panel" className="flex min-h-0 scroll-mt-2 flex-col border-zinc-300 bg-white max-lg:border-t lg:border-l">
          {current === "list" && <BlockList view={view} onSelect={(i) => open({ name: "block", index: i })} />}
          {current === "block" && index !== null && (
            <BlockDetail
              key={index}
              view={view}
              index={index}
              onBack={() => open({ name: "list" })}
              onTamper={() => open({ name: "forge", index })}
              onResume={() => open({ name: "attack" })}
            />
          )}
          {current === "forge" && index !== null && (
            <AttackStart view={view} index={index} onBack={() => open({ name: "block", index })} onStart={(name) => start(index, name)} />
          )}
          {current === "attack" && attack && (
            <AttackProgress
              key={attack.stage}
              view={view}
              attack={attack}
              busy={busy}
              error={error}
              onNext={() => void next()}
              onStop={stop}
              onInspect={(i) => open({ name: "block", index: i })}
            />
          )}
        </aside>
      </div>
      <Credits view={view} />
    </>
  );
}

function Hero({ view }: { view: ChainView | null }) {
  const latest = view?.chain.findLast((b) => b.txs.length > 0);
  const art = latest && view ? artOf(latest, view.photos) : null;
  const tickets = view?.chain.reduce((n, b) => n + b.txs.length, 0) ?? 0;
  const bad = view?.reports?.filter((r) => r.problems.length > 0).map((r) => r.index);
  const state = !bad ? "checking" : bad.length ? "bad" : "good";
  const blocks = view?.chain.length ?? 0;

  return (
    <section className="relative overflow-hidden bg-[#121212] text-white">
      {art && (
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-3/5 lg:block">
          <EventImage event={art} sizes="60vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[#121212]/75 to-[#121212]/25" />
        </div>
      )}
      <div className="relative mx-auto max-w-384 px-5 py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-white/75">
          <Link href="/" className="hover:text-white hover:underline">
            Home
          </Link>{" "}
          / <span className="text-white">Block Explorer</span>
        </nav>
        <h1 className="mt-3 text-4xl font-black md:text-5xl">Block Explorer</h1>
        <p className="mt-2 text-lg text-white/85">
          {view ? `${blocks} ${blocks === 1 ? "block" : "blocks"} · ${tickets} ${tickets === 1 ? "ticket" : "tickets"} · stored in this browser` : "Your demo blockchain, block by block"}
        </p>
        <p role="status" className="mt-6 flex w-fit items-center gap-3 rounded-full bg-white py-2 pr-5 pl-2 text-[#121212]">
          <HealthIcon state={state} className="h-7 w-7" />
          <span>
            <strong>{{ checking: "Checking every block", good: "Chain valid", bad: view?.attack ? "Tampering detected" : "Chain invalid" }[state]}</strong>
            {bad && (
              <span className="text-zinc-600">
                {" · "}
                {bad.length ? `problem in ${bad.length === 1 ? "block" : "blocks"} ${bad.join(", ")}` : "every check passed"}
              </span>
            )}
          </span>
        </p>
      </div>
    </section>
  );
}

function Credits({ view }: { view: ChainView }) {
  const ids = [...new Set(view.chain.flatMap((b) => b.txs.map((t) => t.body.event.id)))].filter((id) => view.photos[id]);
  if (ids.length === 0) return null;
  return (
    <details className="mx-auto max-w-384 px-5 pt-6 text-sm text-zinc-600">
      <summary className="cursor-pointer">Photo credits ({ids.length}), from Wikimedia Commons</summary>
      <ul className="mt-2 space-y-1">
        {ids.map((id) => (
          <li key={id}>
            <PhotoCredit credit={view.photos[id]!.credit} />
          </li>
        ))}
      </ul>
    </details>
  );
}
