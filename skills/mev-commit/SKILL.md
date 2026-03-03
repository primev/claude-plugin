---
name: mev-commit
description: Interact with mev-commit FAST RPC — send preconfirmed transactions, check commitments, and manage gas tank on Ethereum mainnet. Use when the user needs fast transaction confirmation or wants to send transactions through mev-commit.
---

# mev-commit FAST RPC

FAST RPC is a drop-in replacement for any Ethereum JSON-RPC endpoint. Transactions sent through it receive **preconfirmations** — binding commitments from block builders that guarantee inclusion, with sub-second settlement latency.

## Endpoint

```
https://fastrpc.mev-commit.xyz
```

Use it anywhere you would use an Ethereum RPC URL. It supports all standard `eth_*` methods.

## Core Concepts

**Preconfirmation**: When you send a transaction through FAST RPC, a block builder issues a cryptographically signed commitment to include your transaction. This commitment is enforceable on-chain — if the builder breaks it, they get slashed. The result is near-instant transaction confirmation instead of waiting 12 seconds for the next block.

**Gas Tank**: FAST RPC uses a gas tank system. Your account has a gas balance that gets debited when transactions are preconfirmed. Check your balance with the `gas_getBalance` method.

## Sending Preconfirmed Transactions

Send a signed transaction exactly as you would to any Ethereum RPC. The only difference is the endpoint.

### curl Example

```bash
# Send a signed raw transaction
curl -X POST https://fastrpc.mev-commit.xyz \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_sendRawTransaction",
    "params": ["0x YOUR_SIGNED_TX_HEX"],
    "id": 1
  }'
```

Response includes a transaction hash. The preconfirmation commitment is issued immediately — your transaction is guaranteed to land in the next block built by the committing builder.

### Check Transaction Receipt

```bash
curl -X POST https://fastrpc.mev-commit.xyz \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getTransactionReceipt",
    "params": ["0x YOUR_TX_HASH"],
    "id": 1
  }'
```

## Gas Tank

The gas tank is a prepaid balance that covers preconfirmation fees.

### Check Gas Balance

```bash
curl -X POST https://fastrpc.mev-commit.xyz \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "gas_getBalance",
    "params": ["0x YOUR_ADDRESS"],
    "id": 1
  }'
```

## Supported Methods

All standard Ethereum JSON-RPC methods are supported:

- `eth_sendRawTransaction` — send a transaction and receive a preconfirmation
- `eth_getTransactionReceipt` — check transaction status
- `eth_getTransactionByHash` — get transaction details
- `eth_blockNumber` — current block number
- `eth_getBalance` — account ETH balance
- `eth_call` — execute a read-only call
- `eth_estimateGas` — estimate gas for a transaction
- `eth_getBlockByNumber` — get block by number
- `eth_getBlockByHash` — get block by hash
- `eth_chainId` — returns `0x1` (Ethereum mainnet)
- `eth_gasPrice` — current gas price
- `gas_getBalance` — check gas tank balance

## Using with ethers.js

```javascript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://fastrpc.mev-commit.xyz");
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Send a preconfirmed transaction
const tx = await wallet.sendTransaction({
  to: "0xRecipient",
  value: ethers.parseEther("0.01"),
});

// Transaction is preconfirmed immediately
console.log("Preconfirmed tx:", tx.hash);

// Wait for on-chain inclusion
const receipt = await tx.wait();
console.log("Included in block:", receipt.blockNumber);
```

## Using with viem

```typescript
import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x...");

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http("https://fastrpc.mev-commit.xyz"),
});

const hash = await client.sendTransaction({
  to: "0xRecipient",
  value: parseEther("0.01"),
});
```

## Using with cast (Foundry)

```bash
cast send 0xRecipient --value 0.01ether \
  --rpc-url https://fastrpc.mev-commit.xyz \
  --private-key $PRIVATE_KEY
```

## Key Details

- **Network**: Ethereum mainnet (chain ID 1)
- **Latency**: Preconfirmation commitment is sub-second
- **Guarantee**: Builder commitments are enforced by on-chain slashing
- **Compatibility**: Drop-in replacement for any Ethereum RPC — works with ethers.js, viem, web3.py, cast, and any EVM tooling
