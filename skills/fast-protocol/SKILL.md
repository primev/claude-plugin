---
name: fast-protocol
description: Execute instant token swaps on Ethereum via Fast Protocol — gasless ERC-20 swaps with EIP-712 intents and direct ETH swaps through FAST RPC. Use when the user wants to swap tokens instantly or needs gasless swap execution.
---

# Fast Protocol — Instant Token Swaps

Fast Protocol enables instant token swaps on Ethereum mainnet. There are two swap paths:

1. **ERC-20 swaps** — gasless, signed EIP-712 intents submitted to a relayer
2. **ETH swaps** — direct transactions routed through FAST RPC

Both paths settle through Uniswap V3 pools and benefit from mev-commit preconfirmations for guaranteed execution.

## Architecture

```
ERC-20 Swap Flow:
  User signs EIP-712 intent
    → POST /fastswap (relayer)
      → Relayer executes on Settlement Contract
        → Uniswap V3 swap
          → Tokens delivered to user

ETH Swap Flow:
  User sends ETH
    → POST /fastswap/eth
      → FAST RPC routes through mev-commit
        → Settlement Contract wraps ETH → swaps via Uniswap V3
          → Tokens delivered to user
```

## Contract Addresses

| Contract | Address |
|----------|---------|
| Settlement | `0x084C0EC7f5C0585195c1c713ED9f06272F48cB45` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| Uniswap V3 Quoter V2 | `0x61fFE014bA17989E743c5F6cB21bF9697530B21e` |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |

## Getting a Quote

Before swapping, get a quote from Uniswap V3 Quoter V2. This is an on-chain call, so use any Ethereum RPC (or FAST RPC).

### curl Example — Quote

```bash
# Encode the quoteExactInputSingle call
# Function: quoteExactInputSingle((address,address,uint256,uint24,uint160))
# This example quotes swapping 1 WETH for USDC

curl -X POST https://fastrpc.mev-commit.xyz \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [{
      "to": "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
      "data": "0xc6a5026a000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000001f40000000000000000000000000000000000000000000000000000000000000000"
    }, "latest"],
    "id": 1
  }'
```

### JavaScript Example — Quote with viem

```typescript
import { createPublicClient, http, parseAbi, parseEther } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://fastrpc.mev-commit.xyz"),
});

const quoterAbi = parseAbi([
  "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
]);

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const [amountOut] = await client.readContract({
  address: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  abi: quoterAbi,
  functionName: "quoteExactInputSingle",
  args: [{
    tokenIn: WETH,
    tokenOut: USDC,
    amountIn: parseEther("1"),
    fee: 500, // 0.05% pool
    sqrtPriceLimitX96: 0n,
  }],
});

console.log("1 WETH =", Number(amountOut) / 1e6, "USDC");
```

## ERC-20 Swap Flow (Gasless)

ERC-20 swaps are gasless for the user. The relayer pays gas and executes the swap on your behalf. You just sign an EIP-712 intent.

### Step 1: Approve Permit2

The token you're swapping must be approved for Permit2. This is a one-time transaction per token.

```typescript
import { erc20Abi } from "viem";

const approvalHash = await walletClient.writeContract({
  address: TOKEN_ADDRESS,
  abi: erc20Abi,
  functionName: "approve",
  args: [
    "0x000000000022D473030F116dDEE9F6B43aC78BA3", // Permit2
    2n ** 256n - 1n, // max approval
  ],
});
```

### Step 2: Sign EIP-712 Intent

The intent specifies what you want to swap and the minimum amount you'll accept.

```typescript
const domain = {
  name: "FastSwap",
  version: "1",
  chainId: 1,
  verifyingContract: "0x084C0EC7f5C0585195c1c713ED9f06272F48cB45",
};

const types = {
  SwapIntent: [
    { name: "sender", type: "address" },
    { name: "tokenIn", type: "address" },
    { name: "tokenOut", type: "address" },
    { name: "amountIn", type: "uint256" },
    { name: "minAmountOut", type: "uint256" },
    { name: "fee", type: "uint24" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

const intent = {
  sender: account.address,
  tokenIn: WETH,
  tokenOut: USDC,
  amountIn: parseEther("1"),
  minAmountOut: 2400_000000n, // 2400 USDC (6 decimals)
  fee: 500,
  nonce: BigInt(Date.now()),
  deadline: BigInt(Math.floor(Date.now() / 1000) + 300), // 5 min
};

const signature = await walletClient.signTypedData({
  domain,
  types,
  primaryType: "SwapIntent",
  message: intent,
});
```

### Step 3: Submit to Relayer

```bash
curl -X POST https://fastrpc.mev-commit.xyz/fastswap \
  -H "Content-Type: application/json" \
  -d '{
    "intent": {
      "sender": "0xYourAddress",
      "tokenIn": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "tokenOut": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "amountIn": "1000000000000000000",
      "minAmountOut": "2400000000",
      "fee": 500,
      "nonce": "1709500000000",
      "deadline": "1709500300"
    },
    "signature": "0x YOUR_EIP712_SIGNATURE"
  }'
```

Response:

```json
{
  "txHash": "0x...",
  "status": "preconfirmed",
  "amountOut": "2412345678"
}
```

## ETH Swap Flow (Direct)

For swapping ETH directly, send a POST to the ETH swap endpoint. This does not require Permit2 approval since you're sending native ETH.

### curl Example

```bash
curl -X POST https://fastrpc.mev-commit.xyz/fastswap/eth \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "0xYourAddress",
    "tokenOut": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "amountIn": "1000000000000000000",
    "minAmountOut": "2400000000",
    "fee": 500,
    "deadline": "1709500300",
    "signature": "0x YOUR_SIGNATURE"
  }'
```

Response:

```json
{
  "txHash": "0x...",
  "status": "preconfirmed",
  "amountOut": "2412345678"
}
```

## Common Token Addresses

| Token | Address | Decimals |
|-------|---------|----------|
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | 18 |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6 |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 6 |
| DAI | `0x6B175474E89094C44Da98b954EedeAC495271d0F` | 18 |
| WBTC | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | 8 |

## Uniswap V3 Fee Tiers

| Fee | Description | Use Case |
|-----|-------------|----------|
| 100 | 0.01% | Stablecoin pairs (USDC/USDT) |
| 500 | 0.05% | Major pairs (ETH/USDC, ETH/USDT) |
| 3000 | 0.3% | Standard pairs |
| 10000 | 1% | Exotic pairs |

## Key Details

- **Network**: Ethereum mainnet (chain ID 1)
- **ERC-20 swaps**: Gasless for the user, relayer pays gas
- **ETH swaps**: Direct execution through FAST RPC
- **Settlement**: All swaps route through Uniswap V3 pools
- **Preconfirmation**: All swaps benefit from mev-commit builder commitments
- **Slippage**: Set `minAmountOut` to protect against price movement
- **Deadline**: Always set a deadline to prevent stale intents from executing
