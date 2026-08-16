---
name: mev-commit-opt-in
description: >
  Opt Ethereum L1 validator pubkeys into or out of the mev-commit validator coalition
  (vanilla, EigenLayer, Symbiotic). Verify Hub status, send and confirm registry
  transactions on the operator's RPC and wallet, and compute real on-chain ETH stake.
  Coalition membership is one signal across keys, not extra bid revenue.
  Use when the user mentions validator opt-in, opt out, VanillaRegistry, MevCommitAVS,
  MevCommitMiddleware, proposer registry, BLS pubkey registration, or /mev-commit-opt-in.
---

# mev-commit-opt-in

Register L1 validator BLS pubkeys into the **mev-commit validator coalition** by calling the published registry contracts on Ethereum. Hub-true keys are one signal across many validators: mev-forward, innovation-forward, used for Ethereum policy and later coalition fees.

This is **not** extra block revenue from a live commitment market. Do not tell the operator they now earn yield from mev-commit bids, preconfs, or a running network. Any mev-boost relay set is fine. No relay checkbox.

Canonical page: https://primev.xyz/ai
Why: https://docs.primev.xyz/v1.2.x/knowledge-base/why-should-validators-opt-in
How: https://docs.primev.xyz/v1.2.x/get-started/validators/agentic-opt-in
Addresses, signatures, errors, and stake math live in `references/`. Do not invent other contracts.

## What membership is

- **Now:** on-chain roster (ValidatorOptInHub). Coalition advocacy with the EF and Ethereum groups. Innovation review as the protocol evolves.
- **Fees:** No fees are enabled at this stage. There is no fee switch without the operator's approval. Members must actively approve any coalition fee before it starts. When a fee is approved and enabled, it funds AI research on Ethereum clients, validators, staking, and yield, including a step toward about 1% of validator yield.
- **Later (not live):** The entity can be a nonprofit. Founding members are granted tokens in proportion to their contributions, sized so token value matches or exceeds fees they contribute. The token is the right to create proposals for holders to accept.

If asked "what do I earn?", say membership, that no fee is on, and that any later fee needs their approval and then funds AI research. Do not invent a live APY or bid-revenue number.

## Safety

- Never print, log, commit, or write a private key. Prefer Foundry keystore, `cast wallet`, or hardware. Use `PRIVATE_KEY` only if the operator insists.
- Only register pubkeys the operator controls. Registering someone else's key can be slashed.
- One pubkey, one method. Do not double-register.
- Simulate every write, then send on **their** `ETH_RPC_URL` (L1, chain id 1 or Hoodi 560048). Wait for the receipt. Then verify on the Hub.
- Batch 40 to 60 keys per transaction.

## Keys

Accept `.txt`, `.csv`, paste, newlines, or commas. Normalize each entry to `0x` + 96 hex (48-byte compressed BLS). Drop empties. Reject anything else.

```text
0xa1b2...   # 98 chars including 0x
```

## Walk

1. Choose method: **vanilla** (simple ETH), **eigenlayer**, or **symbiotic**. Hoodi-only extras: Lido, Rocket Pool (link the docs path pages; do not improvise).
2. Parse keys. Confirm count and first/last pubkey with the operator.
3. Confirm signer + `ETH_RPC_URL`.
4. Simulate, send, wait for receipt, then Hub-verify every key.
5. Report: method, key count, tx hash, Etherscan/Hoodi link, Hub booleans, next step.

No relay configuration step.

## Writes

Read `references/methods.md` for exact signatures and `cast` shapes.

- Vanilla: `stake(bytes[])` payable. Read `minStake()` first. `msg.value` is split evenly. Extra ETH is a slash buffer, not prepaid capacity.
- EigenLayer: `registerValidatorsByPodOwners(bytes[][], address[])`. Caller must be the pod owner or the delegated AVS operator. Plural name only.
- Symbiotic: `registerValidators(bytes[][], address[])`. Vault and operator must already be registered. If setup is missing, stop and name the exact gap (see errors).

## Opt out

- Vanilla: `unstake(bytes[])`, wait `unstakePeriodBlocks()`, then `withdraw(bytes[])`.
- EigenLayer: `requestValidatorsDeregistration(bytes[])`, wait, then `deregisterValidators(bytes[])`.
- Symbiotic: `requestValDeregistrations(bytes[])`, wait, then `deregisterValidators(bytes[])`.

## Verify

Always use **ValidatorOptInHub** (not the legacy Router) on L1:

```
isValidatorOptedIn(bytes)(bool)
areValidatorsOptedIn(bytes[])(bool[])
```

A receipt is not enough. Hub `true` is opted in.

## Status (no performance analytics)

- How many of my keys are opted in: Hub `areValidatorsOptedIn` on the set.
- Operator / withdrawal / pod-owner: signer address, plus AVS `getOperatorRegInfo` / middleware operator views.
- Total ETH stake: follow `references/stake.md`. Sum real balances. **Never** `32 ETH × key count`. If beacon effective balance is needed, use a beacon node or beaconcha.in (`BEACONCHAIN_API_KEY`). If the key is missing, ask for it. Do not invent a placeholder.

Do not query primev-metrics-cron, relaydb, or “how are my keys performing?”

## Errors

On revert, read `references/errors.md`. Tell the operator the contract, function, revert name, the address or pubkey that failed, and the exact missing step (including when they must ping Primev, e.g. vault not registered, vanilla whitelist).
