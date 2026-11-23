export type Address = `0x${string}`;

export type Account = {
  address: Address;
  name: string;
  role: "organizer" | "fan" | "scalper";
  emoji: string;
  blurb: string;
};

/** Every state change on the ledger is one of these transaction kinds. */
export type TxPayloads = {
  ALLOC: { to: Address; amount: number };
  CREATE_EVENT: {
    name: string;
    venue: string;
    date: string;
    category: EventCategory;
    price: number;
    supply: number;
    /** Royalty paid to the organizer on every resale, in basis points (100 = 1%). */
    royaltyBps: number;
    /** Max resale markup over face value, in basis points (1000 = +10%). */
    maxMarkupBps: number;
    /** Optional banner image (e.g. from an imported Ticketmaster event). */
    imageUrl?: string;
    /** Where the event metadata came from, if imported from an external API. */
    source?: EventSource;
  };
  BUY_TICKET: { eventId: string };
  LIST_TICKET: { ticketId: string; price: number };
  CANCEL_LISTING: { ticketId: string };
  BUY_RESALE: { ticketId: string };
  TRANSFER: { ticketId: string; to: Address };
  CHECK_IN: { ticketId: string };
};

export type TxType = keyof TxPayloads;

export type Tx<T extends TxType = TxType> = {
  [K in T]: {
    hash: string;
    from: Address;
    type: K;
    payload: TxPayloads[K];
    timestamp: number;
  };
}[T];

export type Block = {
  index: number;
  timestamp: number;
  prevHash: string;
  nonce: number;
  difficulty: number;
  txs: Tx[];
  hash: string;
};

export type EventSource = { provider: "ticketmaster"; id: string; url: string };

export type EventCategory = "Concert" | "Festival" | "Sports" | "Theatre" | "eSports" | "Film";

export type ShowEvent = {
  id: string;
  organizer: Address;
  name: string;
  venue: string;
  date: string;
  category: EventCategory;
  price: number;
  supply: number;
  sold: number;
  royaltyBps: number;
  maxMarkupBps: number;
  royaltiesEarned: number;
  primaryRevenue: number;
  imageUrl?: string;
  source?: EventSource;
};

export type TicketHistoryEntry = {
  txHash: string;
  type: "MINT" | "RESALE" | "TRANSFER" | "CHECK_IN";
  from: Address | null;
  to: Address;
  price: number;
  royalty: number;
  timestamp: number;
  block: number | null;
};

export type Ticket = {
  id: string;
  eventId: string;
  serial: number;
  owner: Address;
  usedAt: number | null;
  listing: { price: number } | null;
  history: TicketHistoryEntry[];
};

export type WorldState = {
  balances: Record<Address, number>;
  events: Record<string, ShowEvent>;
  tickets: Record<string, Ticket>;
  eventCount: number;
};
