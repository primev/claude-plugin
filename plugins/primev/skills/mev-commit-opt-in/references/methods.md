# Contract calls

`$RPC` is the operator's L1 RPC. `$KEY` is keystore / wallet flags, never a pasted key in the prompt.

BLS keys are `bytes`: `0x` + 96 hex.

## Vanilla

```bash
cast call $VANILLA "minStake()(uint256)" --rpc-url $RPC
cast send $VANILLA "stake(bytes[])" "[$KEY1,$KEY2]" --value $WEI --rpc-url $RPC
cast send $VANILLA "unstake(bytes[])" "[$KEY1]" --rpc-url $RPC
cast call $VANILLA "unstakePeriodBlocks()(uint256)" --rpc-url $RPC
cast send $VANILLA "withdraw(bytes[])" "[$KEY1]" --rpc-url $RPC
cast call $VANILLA "getStakedAmount(bytes)(uint256)" $KEY1 --rpc-url $RPC
cast call $VANILLA "isValidatorOptedIn(bytes)(bool)" $KEY1 --rpc-url $RPC
```

`msg.value` is split evenly across keys in that tx. Floor is `minStake * n`. Documented `minStake` is 0.0001 ETH; always read it on-chain. Hoodi `stake` is `onlyWhitelistedStaker` (mainnet whitelist coming).

## EigenLayer

```bash
cast send $AVS "registerValidatorsByPodOwners(bytes[][],address[])" "[[$KEY1,$KEY2]]" "[$POD_OWNER]" --rpc-url $RPC
cast send $AVS "requestValidatorsDeregistration(bytes[])" "[$KEY1]" --rpc-url $RPC
cast send $AVS "deregisterValidators(bytes[])" "[$KEY1]" --rpc-url $RPC
cast call $AVS "isValidatorOptedIn(bytes)(bool)" $KEY1 --rpc-url $RPC
cast call $AVS "getOperatorRegInfo(address)(...)" $OPERATOR --rpc-url $RPC
```

Do not use the obsolete singular `registerValidatorsByPodOwner`. Operator registration is `primev/eigen-operator-cli`, not this skill.

## Symbiotic

```bash
cast send $MIDDLEWARE "registerValidators(bytes[][],address[])" "[[$KEY1,$KEY2]]" "[$VAULT]" --rpc-url $RPC
cast send $MIDDLEWARE "requestValDeregistrations(bytes[])" "[$KEY1]" --rpc-url $RPC
cast send $MIDDLEWARE "deregisterValidators(bytes[])" "[$KEY1]" --rpc-url $RPC
cast call $MIDDLEWARE "isValidatorOptedIn(bytes)(bool)" $KEY1 --rpc-url $RPC
cast call $MIDDLEWARE "isValidatorSlashable(bytes)(bool)" $KEY1 --rpc-url $RPC
cast call $MIDDLEWARE "getNumSlashableVals(address,address)(uint256)" $VAULT $OPERATOR --rpc-url $RPC
```

Vault / operator / network setup: docs Symbiotic page and `ExampleSetup.s.sol`. This skill only registers keys after that setup exists.

## Hub (preferred verify)

```bash
cast call $HUB "isValidatorOptedIn(bytes)(bool)" $KEY1 --rpc-url $RPC
cast call $HUB "areValidatorsOptedIn(bytes[])(bool[])" "[$KEY1,$KEY2]" --rpc-url $RPC
```

## Simulate then send

```bash
cast call $CONTRACT "$SIG" $ARGS --from $SENDER --rpc-url $RPC
cast send $CONTRACT "$SIG" $ARGS --rpc-url $RPC
cast receipt $TX --rpc-url $RPC
```

If `$SENDER` is a Safe / multi-sig, **do not** `cast send`. Encode with `cast calldata` and follow `references/safe.md`. Simulate with `--from $SAFE`. Completion is still Hub `areValidatorsOptedIn`.
