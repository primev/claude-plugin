---
name: mev-commit-opt-in
description: >
  Opt Ethereum L1 validator pubkeys into or out of mev-commit (vanilla, EigenLayer, Symbiotic).
  Verify Hub status, send and confirm registry transactions on the operator's RPC and wallet,
  and compute real on-chain ETH stake. Use when the user mentions validator opt-in, opt out,
  VanillaRegistry, MevCommitAVS, MevCommitMiddleware, proposer registry, BLS pubkey registration,
  or /mev-commit-opt-in.
---

# mev-commit-opt-in

Opt L1 validator BLS pubkeys into mev-commit by calling the published registry contracts on Ethereum. Replicate the old dashboard wizard without the relay checkbox. Any mev-boost relay set is fine.

Canonical page: https://primev.xyz/ai
Docs: https://docs.primev.xyz/v1.2.x/get-started/validators/agentic-opt-in
Addresses, signatures, errors, and stake math live in `references/`. Do not invent other contracts.

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
