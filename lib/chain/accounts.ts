import type { Account, Address } from "./types";

/**
 * Demo wallets. On a real chain each address is derived from a public key and
 * transactions are signed with the matching private key. Here we simply
 * "act as" one of these accounts.
 */
export const ACCOUNTS: Account[] = [
  {
    address: "0x7a3f9c2e1b8d4a6f0e5c3b2a19d8e7f6c5b4a392",
    name: "Aurora Live",
    role: "organizer",
    emoji: "🎤",
    blurb: "Event organizer / artist. Creates events, earns primary sales + resale royalties, checks fans in at the gate.",
  },
  {
    address: "0xa11ce0b5e2d4c6a8f0e1d3c5b7a9f8e6d4c2b0a1",
    name: "Alice",
    role: "fan",
    emoji: "🎧",
    blurb: "A fan who buys tickets and sometimes resells them when plans change.",
  },
  {
    address: "0xb0b5f1e3d5c7a9b1e3f5d7c9a1b3e5f7d9c1a3b5",
    name: "Bob",
    role: "fan",
    emoji: "🎸",
    blurb: "A fan who buys on the resale market.",
  },
  {
    address: "0x5ca1fe9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f",
    name: "Sam the Scalper",
    role: "scalper",
    emoji: "🦈",
    blurb: "Tries to buy cheap and resell at 5× — the smart contract won't let him.",
  },
];

export const ORGANIZER = ACCOUNTS[0].address;

export function accountOf(address: Address | null | undefined): Account | undefined {
  return ACCOUNTS.find((a) => a.address === address);
}

export function nameOf(address: Address | null | undefined): string {
  if (!address) return "—";
  return accountOf(address)?.name ?? shortHash(address);
}

export function shortHash(h: string, chars = 6): string {
  if (h.length <= chars * 2 + 2) return h;
  return `${h.slice(0, chars + 2)}…${h.slice(-chars)}`;
}
