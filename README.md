# 🎟️ StageChain: a blockchain ticketing demo for entertainment

A working demo of a **blockchain application (dApp) for the entertainment industry**, built for a blockchain course case study.

Tickets for concerts, festivals, film and eSports events are **tokens on a ledger**. A **smart contract** enforces the business rules:

| Industry problem | What the demo does on-chain |
| --- | --- |
| Scalping and price gouging | Resale price is capped at face value + N%. A listing above the cap **reverts**. |
| Counterfeit or duplicate tickets | The gate scanner checks that the token exists and that the presenting wallet owns it. `CHECK_IN` marks it used **forever**. |
| Artists earn nothing on resales | Every resale automatically pays a **royalty** (basis points) to the organizer. |
| Opaque ownership | Every mint, resale, transfer and check-in is a transaction in a hash-linked block that anyone can audit. |

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

No wallet, testnet or crypto is needed. The whole blockchain runs inside your browser tab and is saved to `localStorage`. Use **Reset demo** in the Block Explorer to start over.

## Guided demo (≈5 min, good for a presentation)

1. **Buy**: act as *Alice* (wallet switcher, top-right) → **Events** → *Buy ticket*. The transaction goes to the mempool and then gets mined into a block.
2. **Scalping attempt**: switch to *Sam the Scalper*, buy a ticket, then **My Tickets** → "Try scalping at 5×" → *List*. The contract reverts with the anti-scalping rule.
3. **Fair resale**: list a ticket at or below the cap, switch to *Bob* → **Resale Market** → *Buy*. The organizer receives the royalty, which shows under "Earned".
4. **Gate**: switch to *Aurora Live* → **Gate Check-in** → verify and admit. Scan the same ticket again (denied: already used). Try `EVT-1#999` (denied: counterfeit) or the wrong presenting wallet (denied: not the owner).
5. **Immutability**: **Block Explorer** → select a block → *Tamper with this block* → change a price → save. That block and every block after it turn red. *Re-mine* shows why rewriting history costs proof-of-work, which is the idea behind a 51% attack.

## How it works

```
lib/chain/
  types.ts        Tx, Block, Ticket, Event, WorldState types
  blockchain.ts   SHA-256 (Web Crypto), proof-of-work mining, chain validation
  contract.ts     The "smart contract": applyTx(state, tx) → newState or Revert
  accounts.ts     Demo wallets
components/
  chain-provider.tsx  The "node": mempool, mining, replay → world state, persistence
  views/*             Events, Resale Market, Wallet, Gate, Explorer UIs
contracts/
  StageTicket.sol     The same rules written as a Solidity (EVM) contract, for reference
```

- **State is derived, not stored.** The app replays every transaction in every block through `applyTx` to compute balances and ticket ownership, the same way an Ethereum node computes world state.
- **Validation before inclusion.** A transaction is simulated against chain + mempool first. If it reverts, it never enters a block, like a failed `require()` in Solidity.
- **Proof-of-work.** A block is valid only when `SHA-256(header + txs)` starts with 3 hex zeros. Each block also stores `prevHash`, which links the chain.

### Simplifications compared with a real blockchain

| Demo | Real world |
| --- | --- |
| One node (your browser) | Thousands of peer-to-peer nodes reaching consensus |
| Wallet switcher, no signatures | ECDSA (secp256k1) signatures from a private key, e.g. MetaMask |
| Integer `TIX` token | ETH / stablecoins (USDC) paid in wei |
| Tiny PoW difficulty | Ethereum uses Proof-of-Stake; Bitcoin uses PoW at enormous difficulty |
| Ticket ID + wallet picker at the gate | Rotating QR code with a signed challenge, so a screenshot is useless |

## Discussion points for the case study

- **Benefits:** transparency, programmable rules (royalties and caps), less fraud, interoperable tickets (any wallet or marketplace can read them), and a direct artist-to-fan relationship.
- **Challenges:** UX of wallets and keys, gas fees and scalability (so usually L2s like Polygon or Base), off-chain scalping (selling the wallet's private key), privacy of an on-chain purchase history, regulation and consumer protection (refunds), and energy use for PoW chains.
- **Real-world examples worth researching:** NFT ticketing pilots by major ticketing platforms, GET Protocol, YellowHeart, and music royalty projects such as Audius and Royal.

> Educational project. Not audited, no real money.
