# On-chain ETH stake

Never report `32 ETH × opted-in key count`. Sum real balances.

## Beacon effective balance (required for restaked / beacon-backed keys)

Each opted-in BLS key has an effective balance on the beacon chain. Resolve it:

1. Operator's beacon RPC: `/eth/v1/beacon/states/head/validators/0xPUBKEY` → `data.validator.effective_balance` (gwei).
2. Or beaconcha.in: `GET https://beaconcha.in/api/v1/validator/{pubkey}` with `BEACONCHAIN_API_KEY` if required.

If neither is available, ask for a beacon RPC or a beaconcha.in API key. Do not substitute 32 ETH.

## Vanilla extra stake

```bash
cast call $VANILLA "getStakedAmount(bytes)(uint256)" $KEY --rpc-url $RPC
```

This is ETH locked in VanillaRegistry, separate from beacon stake. Add it. Do not treat it as the validator's 32 ETH.

## EigenLayer restake

Read actual shares / underlying from EigenLayer core for the pod owner or operator (`StrategyManager`, `DelegationManager`, EigenPod). Do not assume 32 ETH per key. Beacon effective balance still applies to each pubkey.

## Symbiotic

Report slashable / allocated collateral from middleware + vault views (`getNumSlashableVals`, vault stake toward the operator). Token may be ETH or an ERC20. Name the asset. Do not convert unknown tokens into “32 ETH”.

## Output

For a set of keys, print a table: pubkey, Hub opted-in, beacon effective ETH, vanilla extra ETH, restake/collateral notes, row total. Then a sum. If a row cannot be resolved, say why and omit it from the sum rather than filling 32.
