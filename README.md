# TicketLedger

**Live demo: https://ticketledger-three.vercel.app/**

TicketLedger is a student case study on blockchain in entertainment. You can browse events, get a demo ticket recorded on a small blockchain in your browser, and then try to forge it.

> **This is an academic project, not a real ticketing service.** Tickets give no entry to any event, and TIX is play money with no value.

## What you can do

- **Browse and search events** in five sections: Concerts, Sports, Arts & Theater, Family and Film.
- **Get a demo ticket.** Your browser creates a wallet, signs a transaction and mines a block.
- **See your tickets** and their blockchain records in My Tickets.
- **Inspect and attack the chain** in the Block Explorer. A guided attack on a copy shows which check catches each trick.

## Problems and answers

| Problem | How the demo answers it | What it does not solve |
| --- | --- | --- |
| Fake tickets | Each ticket is signed with its owner's private key. Changing it breaks the signature. | The contract cannot confirm that an event is real. |
| Bulk buying | The contract allows 4 tickets per wallet and 100 per event. | One person can create several wallets. |
| Hidden history | Each purchase is in a block linked to the one before it. | This chain has only one node. |

## Run it locally

Requires [Node.js](https://nodejs.org/) 20.9 or later. No accounts or API keys are needed.

```bash
npm install
npm run dev
```

Open http://localhost:3000. To run the production build:

```bash
npm run build
npm start
```

Use `localhost` or HTTPS: browsers allow the required cryptography only on secure pages.

### Optional settings

Copy `.env.example` to `.env.local`, then restart the server.

| Variable | Purpose |
| --- | --- |
| `EVENTS_USE_SAMPLE` | `true` uses fictional events for every list. Useful for presenting offline. |
| `MUSICBRAINZ_CONTACT` | Email or URL sent to MusicBrainz, whose API rules ask for contact details. |

The `TICKETMASTER_*` variables are for a client that no page uses yet.

## How the blockchain works

1. **Wallet:** the browser creates an ECDSA P-256 key pair. The address comes from a SHA-256 hash of the public key. Every wallet starts with 1,000 TIX.
2. **Transaction:** buying a ticket signs the event details and a nonce, which prevents the transaction from being used twice.
3. **Contract:** [`contract.ts`](lib/chain/contract.ts) checks the price (50 TIX), balance, supply, wallet limit and event date. It is TypeScript code that plays the role of a smart contract.
4. **Block:** the browser searches for a nonce that makes the block's SHA-256 hash start with three zeros. The block also stores the previous block's hash.
5. **Validation:** every load replays the chain and checks all links, hashes, proof-of-work, signatures and contract rules.

Balances and ticket ownership are calculated from the chain. The chain and wallet are saved in the browser's `localStorage`.

### Attack demo

| The attacker... | The chain still detects |
| --- | --- |
| changes a ticket | wrong transaction hash, invalid signature |
| recalculates the transaction hash | wrong block hash, invalid signature |
| re-mines that block | broken link to the next block, invalid signature |
| re-mines every later block | **invalid signature** |

Redoing the work can repair hashes and links, but it cannot produce the owner's signature without their private key.

## Presentation script (about 5 minutes)

**Before you start:** open the home page and one concert in advance, because live sources can be slow. Use the same browser throughout, and get four tickets for different events.

1. **Home:** introduce the problem and the disclaimer.
2. **Event page:** get one more ticket and point out the wallet, price and new block.
3. **My Tickets:** open a ticket's blockchain record.
4. **Block Explorer:** show how the facing edges of neighboring blocks have the same color.
5. **Attack:** select block 1, choose **Try to tamper with this ticket**, and go through all four steps.
6. **Limits:** finish with the section below.

**Offline backup:** run it locally with `EVENTS_USE_SAMPLE=true`.

## Limits

- **One node.** Nothing is decentralized here. On a real network, many independent nodes would keep copies and reject a forged chain.
- **An owner can re-sign their own ticket.** With one node, nobody else holds the original to compare.
- **No organizer.** Real tickets would need the organizer to issue and accept them.
- **Demo wallet.** The private key is stored unprotected in the browser. Clearing site data deletes the wallet and tickets.
- **Not built:** resale, transfers, royalties and gate check-in.
- **Cancelled events** are blocked on the event page, not by the contract.
- **Search** covers only events listed in the five sections.

## Data sources

| Content | Source |
| --- | --- |
| Concerts | [MusicBrainz](https://musicbrainz.org/) |
| Artist photos | [Wikimedia Commons](https://commons.wikimedia.org/), found through [Wikidata](https://www.wikidata.org/). Authors and licences are credited on the site. |
| Sports | [TheSportsDB](https://www.thesportsdb.com/), using its free shared key. Times are UTC. |
| Arts & Theater, Family, Film | Fictional sample events |
| Other artwork | Generated from the event's ID |

If a live source fails, its list shows sample events with a label. Listings may be incomplete or out of date. This project is not affiliated with or endorsed by these sources, or by any artist, team or venue.

## Project structure

```text
app/                  Pages
components/
  events/             Event cards, lists, images and the ticket panel
  explorer/           Block map, details and attack flow
  tickets/            My Tickets
lib/
  chain/              Blockchain, contract rules and browser storage
  catalog.ts          Chooses live or sample events
  musicbrainz.ts      Concerts
  sportsdb.ts         Sports
  artist-photos.ts    Artist photos and licences
  sample-events.ts    Fictional events
  search.ts           Search
```

Built with Next.js 16, React 19, TypeScript and Tailwind CSS 4. The blockchain uses the browser's Web Crypto API and no blockchain library.

## Licensing

No licence has been chosen for this code. The Avenir font files are commercial and are not covered by any licence for this project. Event data and photos keep the terms of their sources.
