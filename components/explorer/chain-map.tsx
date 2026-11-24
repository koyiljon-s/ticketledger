import { EventImage } from "@/components/events/event-image";
import { hashTint } from "./hash";
import { HealthIcon, Icon } from "./icons";
import { artOf, healthOf, titleOf, type ChainView } from "./types";

type Props = { view: ChainView; selected: number | null; onSelect: (index: number) => void };

/** The "seat map": every block is a ticket, and its edges show the hashes that join it to its neighbours. */
export function ChainMap({ view, selected, onSelect }: Props) {
  return (
    <div className="flex h-full flex-col bg-[#eef0f4]">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-zinc-300 px-5 py-3 text-sm text-zinc-700">
        <Key className="bg-[#0a7d42]">Valid</Key>
        <Key className="bg-[#d7263d]">Problem</Key>
        <Key className="bg-[#024bde]">Selected</Key>
        <span className="ml-auto text-zinc-600">Facing edges must be the same color</span>
      </div>
      <ol aria-label="Map of blocks, oldest first" className="flex flex-1 overflow-x-auto py-5 pr-5 sm:grid sm:auto-rows-max sm:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] sm:content-start sm:gap-y-8 sm:overflow-x-hidden sm:overflow-y-auto sm:p-8 sm:pl-4">
        {view.chain.map((block, i) => {
          const linked = i === 0 || block.prevHash === view.chain[i - 1].hash;
          const art = artOf(block, view.photos);
          const active = selected === i;
          return (
            <li key={i} className="flex w-60 shrink-0 items-center sm:w-auto">
              <span
                aria-hidden
                className={`flex h-6 w-8 shrink-0 items-center justify-center ${i === 0 ? "invisible" : linked ? "text-[#0a7d42]" : "text-[#d7263d]"}`}
              >
                <Icon name={linked ? "link" : "cross"} className="h-5 w-5" />
              </span>
              <button
                type="button"
                data-block={i}
                aria-pressed={active}
                aria-label={`Block ${i}, ${titleOf(block)}, ${healthOf(view, i)}${linked ? "" : ", link broken"}`}
                onClick={() => onSelect(i)}
                className={`relative flex w-full min-w-0 overflow-hidden rounded-md bg-white text-left shadow transition duration-150 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#024bde] motion-reduce:transform-none ${
                  active ? "ring-3 ring-[#024bde]" : healthOf(view, i) === "bad" ? "ring-2 ring-[#d7263d]" : ""
                }`}
              >
                <Edge hash={block.prevHash} view={view} />
                <span className="min-w-0 flex-1">
                  <span className="relative block h-28 overflow-hidden bg-[#121212]">
                    {art ? (
                      <EventImage event={art} sizes="260px" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-white/70">
                        <Icon name="shield" className="h-9 w-9" />
                      </span>
                    )}
                    <HealthIcon state={healthOf(view, i)} className="absolute top-2 right-2 h-6 w-6 shadow" />
                  </span>
                  <span className="block border-t-2 border-dashed border-zinc-300 px-3 py-2">
                    <span className="block text-sm font-bold">Block {i}</span>
                    <span className="block truncate text-xs text-zinc-600">{titleOf(block)}</span>
                  </span>
                </span>
                <Edge hash={block.hash} view={view} />
                {view.attack?.target === i && (
                  <span className="absolute top-2 left-4 rounded-full bg-[#121212] px-2 py-0.5 text-xs font-bold text-white">Edited</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Edge({ hash, view }: { hash: string; view: ChainView }) {
  return <span aria-hidden title={hash} style={{ backgroundColor: hashTint(hash, view.colors) }} className="w-2 shrink-0" />;
}

function Key({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className={`h-3 w-3 rounded-full ${className}`} />
      {children}
    </span>
  );
}
