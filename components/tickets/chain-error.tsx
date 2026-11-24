"use client";

import { resetChain } from "@/lib/chain/store";

/** Shown when the saved chain can't be loaded or fails validation. */
export function ChainError({ message }: { message: string }) {
  return (
    <>
      <p role="alert" className="font-bold text-red-700">
        {message}
      </p>
      <button
        className="mt-4 rounded-md border border-zinc-300 px-4 py-2 text-sm font-bold"
        onClick={() => {
          if (confirm("Start a new demo blockchain? All demo tickets in this browser will be lost.")) void resetChain();
        }}
      >
        Reset demo blockchain
      </button>
    </>
  );
}
