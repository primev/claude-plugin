---
name: x402
description: Execute agentic USDC payments using the x402 HTTP payment protocol — sign EIP-3009 authorizations, settle payments, and verify receipts. Use when an agent needs to pay for API access or when building pay-per-call services.
---

# x402 — Agentic USDC Payments

x402 is an HTTP-native payment protocol that lets AI agents pay for API access using USDC on Ethereum. It extends HTTP 402 Payment Required into a machine-readable payment flow.

## How It Works

```
Agent → GET /api/resource → 402 Payment Required (with payment details)
Agent → Signs EIP-3009 transferWithAuthorization
Agent → Retries request with X-PAYMENT header
Server → Forwards to Facilitator for settlement
Facilitator → Settles USDC on-chain
Server → Returns the resource
```

The agent never needs to hold ETH for gas. EIP-3009 `transferWithAuthorization` allows gasless USDC transfers where the facilitator pays the gas and deducts it from the payment.

## Facilitator Endpoint

```
https://facilitator.primev.xyz
```

## Contract Addresses

| Contract | Address |
|----------|---------|
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |

## Fee Structure

- **80%** goes to the publisher (API provider)
- **20%** platform fee

## API Reference

### GET /supported

Check which assets and networks the facilitator supports.

```bash
curl https://facilitator.primev.xyz/supported
```

Response:

```json
{
  "kinds": [
    {
      "x402Version": 2,
      "scheme": "exact",
      "network": "eip155:1"
    }
  ],
  "extensions": ["bazaar"],
  "signers": {
    "eip155:*": ["0x488d87a9A88a6A878B3E7cf0bEece8984af9518D"]
  }
}
```

### POST /settle

Submit a signed EIP-3009 authorization for settlement.

```bash
curl -X POST https://facilitator.primev.xyz/settle \
  -H "Content-Type: application/json" \
  -d '{
    "payment": {
      "from": "0xAgentAddress",
      "to": "0xPublisherAddress",
      "value": "1000000",
      "validAfter": "0",
      "validBefore": "1709500300",
      "nonce": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "signature": "0x EIP3009_SIGNATURE"
    },
    "asset": "USDC",
    "network": "eip155:1"
  }'
```

Response:

```json
{
  "txHash": "0x...",
  "status": "settled",
  "amount": "1000000",
  "publisherAmount": "800000",
  "platformFee": "200000"
}
```

### POST /verify

Verify a payment was settled on-chain.

```bash
curl -X POST https://facilitator.primev.xyz/verify \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "0x SETTLEMENT_TX_HASH",
    "from": "0xAgentAddress",
    "to": "0xPublisherAddress",
    "value": "1000000",
    "network": "eip155:1"
  }'
```

Response:

```json
{
  "verified": true,
  "blockNumber": 19500000,
  "timestamp": 1709500000
}
```

## EIP-3009 Signing — TypeScript with viem

EIP-3009 defines `transferWithAuthorization`, which lets a third party (the facilitator) submit a USDC transfer on behalf of the signer. The agent signs; the facilitator executes.

```typescript
import { createWalletClient, http, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0x...");

const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http("https://fastrpc.mev-commit.xyz"),
});

// EIP-3009 domain for USDC
const domain = {
  name: "USD Coin",
  version: "2",
  chainId: 1,
  verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as `0x${string}`,
};

const types = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

// Generate a random nonce
const nonce = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}` as `0x${string}`;

const message = {
  from: account.address,
  to: "0xPublisherAddress" as `0x${string}`,
  value: parseUnits("1", 6), // 1 USDC
  validAfter: 0n,
  validBefore: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
  nonce,
};

const signature = await walletClient.signTypedData({
  domain,
  types,
  primaryType: "TransferWithAuthorization",
  message,
});

console.log("Signature:", signature);
```

## Full Agent Payment Flow — TypeScript

This example shows a complete agent flow: hit a 402, sign the payment, retry with the payment header.

```typescript
import { createWalletClient, http, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http("https://fastrpc.mev-commit.xyz"),
});

async function payAndAccess(apiUrl: string) {
  // Step 1: Make the initial request
  const response = await fetch(apiUrl);

  if (response.status !== 402) {
    // No payment needed
    return response.json();
  }

  // Step 2: Parse payment requirements from 402 response
  const paymentRequired = await response.json();
  const { to, amount, asset, network } = paymentRequired;

  // Step 3: Sign EIP-3009 authorization
  const nonce = `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("hex")}` as `0x${string}`;

  const signature = await walletClient.signTypedData({
    domain: {
      name: "USD Coin",
      version: "2",
      chainId: 1,
      verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    types: {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    },
    primaryType: "TransferWithAuthorization",
    message: {
      from: account.address,
      to,
      value: BigInt(amount),
      validAfter: 0n,
      validBefore: BigInt(Math.floor(Date.now() / 1000) + 3600),
      nonce,
    },
  });

  // Step 4: Build the X-PAYMENT header
  const payment = {
    from: account.address,
    to,
    value: amount,
    validAfter: "0",
    validBefore: String(Math.floor(Date.now() / 1000) + 3600),
    nonce,
    signature,
  };

  const xPayment = Buffer.from(JSON.stringify(payment)).toString("base64");

  // Step 5: Retry with payment
  const paidResponse = await fetch(apiUrl, {
    headers: {
      "X-PAYMENT": xPayment,
    },
  });

  return paidResponse.json();
}

// Usage
const data = await payAndAccess("https://api.example.com/expensive-endpoint");
console.log("Got data:", data);
```

## Building a Pay-Per-Call API (Server Side)

If you're building an API that accepts x402 payments, here's the server-side flow.

```typescript
import { Hono } from "hono";

const app = new Hono();

const FACILITATOR = "https://facilitator.primev.xyz";
const PUBLISHER_ADDRESS = "0xYourWalletAddress";
const PRICE_USDC = "100000"; // $0.10 per call (6 decimals)

app.get("/api/data", async (c) => {
  const xPayment = c.req.header("X-PAYMENT");

  if (!xPayment) {
    // Return 402 with payment instructions
    return c.json(
      {
        to: PUBLISHER_ADDRESS,
        amount: PRICE_USDC,
        asset: "USDC",
        network: "eip155:1",
        facilitator: FACILITATOR,
      },
      402
    );
  }

  // Decode and settle the payment
  const payment = JSON.parse(Buffer.from(xPayment, "base64").toString());

  const settleResponse = await fetch(`${FACILITATOR}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payment,
      asset: "USDC",
      network: "eip155:1",
    }),
  });

  if (!settleResponse.ok) {
    return c.json({ error: "Payment settlement failed" }, 402);
  }

  // Payment settled — return the resource
  return c.json({ data: "your valuable API response" });
});

export default app;
```

## curl — Complete Payment Flow

```bash
# Step 1: Hit the API and get a 402
curl -i https://api.example.com/api/data
# HTTP/1.1 402 Payment Required
# {"to":"0xPublisher","amount":"100000","asset":"USDC",...}

# Step 2: Sign the payment off-chain (your agent does this programmatically)

# Step 3: Retry with payment header
curl https://api.example.com/api/data \
  -H "X-PAYMENT: BASE64_ENCODED_PAYMENT_JSON"
# {"data":"your valuable API response"}

# Step 4: Optionally verify the payment settled
curl -X POST https://facilitator.primev.xyz/verify \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0x...","from":"0xAgent","to":"0xPublisher","value":"100000","network":"ethereum-mainnet"}'
```

## Key Details

- **Asset**: USDC on Ethereum mainnet (6 decimals)
- **Gas**: Agent never pays gas — facilitator handles on-chain settlement
- **Authorization**: EIP-3009 `transferWithAuthorization` (gasless USDC transfers)
- **Fee split**: 80% to publisher, 20% platform fee
- **Header**: Payment authorization goes in the `X-PAYMENT` HTTP header as base64-encoded JSON
- **Verification**: Use `/verify` to confirm on-chain settlement after the fact
