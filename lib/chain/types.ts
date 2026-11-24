export type Address = `0x${string}`;

/** The only transaction so far: buy (mint) one demo ticket. */
export type MintBody = {
  type: "MINT_TICKET";
  from: Address;
  /** Counts the sender's transactions, so a signed tx can't be replayed. */
  nonce: number;
  timestamp: number;
  event: { id: string; name: string; date: string | null; venue: string | null };
  /** Sender's public key (base64 raw P-256); its hash must equal `from`. */
  publicKey: string;
};

export type Tx = { body: MintBody; signature: string; hash: string };

export type BlockContent = {
  index: number;
  timestamp: number;
  prevHash: string;
  difficulty: number;
  nonce: number;
  txs: Tx[];
};

export type Block = BlockContent & { hash: string };

export type Ticket = {
  id: string;
  serial: number;
  owner: Address;
  event: MintBody["event"];
  txHash: string;
  blockIndex: number;
};

export type WorldState = {
  balances: Record<Address, number>;
  nonces: Record<Address, number>;
  tickets: Ticket[];
};
