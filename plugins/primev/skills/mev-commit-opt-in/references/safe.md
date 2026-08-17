# Safe / multi-sig (hand-hold)

A Gnosis Safe (Safe{Wallet}) cannot `cast send`. It has no private key. An owner key is not the Safe. If you send from an owner, `msg.sender` is the owner and vanilla unstake rights, EigenLayer, or Symbiotic will bind to the wrong address.

**Never collect owner private keys.** Never `cast send` with an owner key "as the Safe."

## When to use this path

Use it if the operator says Safe, Gnosis, multi-sig, or multisig, or if the signer address has contract code:

```bash
cast code $SAFE --rpc-url $RPC
```

Empty / `0x` is an EOA. Use the normal send path. Non-empty is a contract. Treat it as a Safe unless they say otherwise.

Ask, in plain words:

> Opt-in has to be sent **by the Safe**, not by one owner wallet. I will simulate and encode the call. You propose it in Safe, owners sign to threshold, someone executes. I then check the Hub until your keys are true. I will not ask for owner keys.

## Who the Safe must be

| Method | The Safe must be |
| --- | --- |
| Vanilla | The staker. Only this Safe can unstake later. ETH for `minStake * n` must sit **in the Safe**. Hoodi whitelist is the **Safe** address. |
| EigenLayer | The pod owner, or the delegated AVS operator. |
| Symbiotic | The registered operator on MevCommitMiddleware. |

If the Safe is only a treasury and the operator is a different EOA, stop. Tell them which address must send, and offer the EOA path or a Safe that actually holds the role.

## Walk (say each step out loud)

1. **Confirm.** Safe address, network (mainnet 1 or Hoodi 560048), method, key count, first and last pubkey.
2. **Simulate as the Safe.** Do not send.

```bash
cast call $CONTRACT "$SIG" $ARGS --from $SAFE --rpc-url $RPC
```

Vanilla: also `cast balance $SAFE --rpc-url $RPC` and `cast call $VANILLA "minStake()(uint256)" --rpc-url $RPC`. Need `balance >= minStake * n`.

If the call reverts, stop and use `references/errors.md`. Do not hand them a doomed Safe tx.

3. **Encode.**

```bash
# vanilla (also compute $WEI = minStake * n, or more as a slash buffer)
cast calldata "stake(bytes[])" "[$KEY1,$KEY2]"

# eigenlayer
cast calldata "registerValidatorsByPodOwners(bytes[][],address[])" "[[$KEY1,$KEY2]]" "[$POD_OWNER]"

# symbiotic
cast calldata "registerValidators(bytes[][],address[])" "[[$KEY1,$KEY2]]" "[$VAULT]"
```

Same for opt-out functions in `references/methods.md`.

4. **Hand them this card.** Copy it into the chat as a checklist.

```
Safe opt-in (do not send from an owner wallet)

Network: Ethereum mainnet (or Hoodi if that is the Safe)
Open: https://app.safe.global  (open THIS Safe)
New transaction → Transaction Builder

To:        $CONTRACT
Value:     $WEI wei   (vanilla stake only; otherwise 0)
Data:      $CALLDATA
Operation: Call   (not DelegateCall)

1. Create the batch / review.
2. Propose the transaction.
3. Owners sign until you hit the Safe threshold.
4. Execute. Wait until Safe shows Success and there is an L1 tx hash.

Then paste back here:
- the L1 transaction hash (best), or
- "executed" if you cannot find the hash.

I will not mark this done until ValidatorOptInHub returns true for every key.
```

Optional import JSON (Transaction Builder → three dots → import):

```json
{
  "version": "1.0",
  "chainId": "1",
  "meta": { "name": "mev-commit opt-in", "description": "Register validator keys" },
  "transactions": [
    {
      "to": "$CONTRACT",
      "value": "$WEI",
      "data": "$CALLDATA"
    }
  ]
}
```

Use `"560048"` for Hoodi `chainId` if they are on Hoodi. If Hoodi is missing from app.safe.global, say so and stop. Do not invent a Safe host.

5. **Wait with them.** Tell them what "done" looks like on their side: Safe tx Status = Success, plus an L1 hash on Etherscan or Hoodi.

## How you know it is complete

**Source of truth is the Hub, not the Safe UI and not a receipt.**

Same contracts as a normal send:

```bash
cast call $HUB "areValidatorsOptedIn(bytes[])(bool[])" "[$KEY1,$KEY2]" --rpc-url $RPC
```

| What they give you | What you do |
| --- | --- |
| L1 tx hash | `cast receipt $TX --rpc-url $RPC`. If status 0, decode the revert and stop. If status 1, still Hub-check. |
| "executed" / Safe link / no hash | Skip receipt. Hub-check the exact key set. |
| Nothing yet | Stay on this path. Remind them: propose → sign to threshold → execute. |

If Hub is still all `false` after they say executed:

- Wait ~15 seconds and call Hub again. Repeat for a few minutes (new blocks).
- Then report: which keys are true, which are false. Ask for the L1 hash if you do not have it.
- Do not invent a receipt. Do not say opted in.

A Safe "queued" or "awaiting confirmations" tx is **not** complete.

## Opt out

Same path. Encode `unstake` / `requestValidatorsDeregistration` / `requestValDeregistrations` (then the later withdraw / deregister after the wait). The Safe must be the same address that opted in.

## Say this if they push for a single-key send

> I cannot send this from one owner key. The registry records the Safe as the caller. One owner signing a `cast send` would register the owner, not the Safe, and you could lose the ability to unstake.
