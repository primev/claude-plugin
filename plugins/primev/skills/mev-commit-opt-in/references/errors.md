# Reverts

Always report: contract, function, revert name, the address or pubkey that failed, and the missing step.

| Revert | Meaning | Tell the operator |
| --- | --- | --- |
| `VaultNotRegistered` | Vault is not on MevCommitMiddleware | Primev must `registerVaults` first. Give them the vault address. |
| `OperatorNotEntity` / `OperatorNotRegistered` | Signer is not a registered operator | Run the Symbiotic / AVS setup in docs, or ask Primev to `registerOperators` for this address. |
| `ValidatorsNotSlashable` | Not enough slashable collateral for this many keys | Increase vault allocation or register fewer keys. `getNumSlashableVals(vault, operator)` is the cap. |
| `SenderIsNotWhitelistedStaker` | Vanilla whitelist | Ask Primev to whitelist this operator address. Hoodi is live; mainnet whitelist is coming. |
| `SenderNotPodOwnerOrOperator` | Signer is neither pod owner nor delegated AVS operator | Switch to the pod-owner or operator key. |
| `ValidatorNotActiveWithEigenCore` | Pubkey is not an active EigenPod validator | Confirm the key is natively restaked and active on EigenLayer. |
| `NoPodExists` | No pods for this account | The signer has no EigenPod / delegation to use. |
| `ValidatorRecordMustNotExist` | Key already registered | Skip already-opted-in keys. Verify on the Hub first. |

If the revert is unknown, print the raw error data and still include contract + function + pubkey.
