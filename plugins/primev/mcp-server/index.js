#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const FASTRPC_URL = "https://fastrpc.mev-commit.xyz";
const FACILITATOR_URL = "https://facilitator.primev.xyz";

async function rpcCall(method, params = []) {
  const res = await fetch(FASTRPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  return res.json();
}

const server = new McpServer({
  name: "primev-fastrpc",
  version: "1.0.0",
});

// --- FAST RPC Tools ---

server.tool(
  "eth_blockNumber",
  "Get the current Ethereum block number via FAST RPC",
  {},
  async () => {
    const result = await rpcCall("eth_blockNumber");
    const blockNum = parseInt(result.result, 16);
    return {
      content: [{ type: "text", text: `Current block: ${blockNum} (${result.result})` }],
    };
  }
);

server.tool(
  "eth_getBalance",
  "Get the ETH balance of an address via FAST RPC",
  { address: z.string().describe("Ethereum address (0x...)") },
  async ({ address }) => {
    const result = await rpcCall("eth_getBalance", [address, "latest"]);
    if (result.error) {
      return { content: [{ type: "text", text: `Error: ${result.error.message}` }] };
    }
    const wei = BigInt(result.result);
    const eth = Number(wei) / 1e18;
    return {
      content: [{ type: "text", text: `Balance of ${address}: ${eth} ETH (${wei} wei)` }],
    };
  }
);

server.tool(
  "eth_gasPrice",
  "Get the current gas price on Ethereum via FAST RPC",
  {},
  async () => {
    const result = await rpcCall("eth_gasPrice");
    const gwei = Number(BigInt(result.result)) / 1e9;
    return {
      content: [{ type: "text", text: `Gas price: ${gwei.toFixed(2)} gwei (${result.result})` }],
    };
  }
);

server.tool(
  "eth_getTransactionReceipt",
  "Get the receipt of a transaction by hash. Use after sending a preconfirmed transaction to check its status.",
  { txHash: z.string().describe("Transaction hash (0x...)") },
  async ({ txHash }) => {
    const result = await rpcCall("eth_getTransactionReceipt", [txHash]);
    if (result.error) {
      return { content: [{ type: "text", text: `Error: ${result.error.message}` }] };
    }
    if (!result.result) {
      return { content: [{ type: "text", text: `Transaction ${txHash} not found or pending.` }] };
    }
    const r = result.result;
    return {
      content: [{
        type: "text",
        text: [
          `Transaction: ${txHash}`,
          `Status: ${r.status === "0x1" ? "Success" : "Reverted"}`,
          `Block: ${parseInt(r.blockNumber, 16)}`,
          `Gas used: ${parseInt(r.gasUsed, 16)}`,
          `From: ${r.from}`,
          `To: ${r.to}`,
        ].join("\n"),
      }],
    };
  }
);

server.tool(
  "eth_sendRawTransaction",
  "Send a signed raw transaction through FAST RPC for preconfirmed inclusion. The transaction will receive a binding builder commitment for sub-second confirmation.",
  { signedTx: z.string().describe("Signed raw transaction hex (0x...)") },
  async ({ signedTx }) => {
    const result = await rpcCall("eth_sendRawTransaction", [signedTx]);
    if (result.error) {
      return { content: [{ type: "text", text: `Error: ${result.error.message}` }] };
    }
    return {
      content: [{
        type: "text",
        text: `Transaction sent and preconfirmed!\nHash: ${result.result}\n\nThe transaction has a binding builder commitment for inclusion in the next block.`,
      }],
    };
  }
);

server.tool(
  "mevcommit_getTransactionCommitments",
  "Get the preconfirmation commitments for a transaction sent through FAST RPC. Returns provider addresses, commitment signatures, and decay timestamps.",
  { txHash: z.string().describe("Transaction hash (0x...)") },
  async ({ txHash }) => {
    const result = await rpcCall("mevcommit_getTransactionCommitments", [txHash]);
    if (result.error) {
      return { content: [{ type: "text", text: `Error: ${result.error.message}` }] };
    }
    if (!result.result || result.result.length === 0) {
      return { content: [{ type: "text", text: `No commitments found for ${txHash}. The transaction may not have been sent through FAST RPC or commitments are still pending.` }] };
    }
    const commitments = result.result;
    const summary = commitments.map((c, i) => [
      `Commitment ${i + 1}:`,
      `  Provider: ${c.provider_address}`,
      `  Block: ${c.block_number}`,
      `  Bid amount: ${c.bid_amount}`,
      `  Dispatched: ${new Date(c.dispatch_timestamp).toISOString()}`,
    ].join("\n")).join("\n\n");
    return {
      content: [{ type: "text", text: `${commitments.length} preconfirmation commitment(s) for ${txHash}:\n\n${summary}` }],
    };
  }
);

server.tool(
  "mevcommit_optInBlock",
  "Get the time in seconds until the next Ethereum block built by a mev-commit opted-in validator. Useful for deciding when to send transactions for preconfirmation.",
  {},
  async () => {
    const result = await rpcCall("mevcommit_optInBlock");
    if (result.error) {
      return { content: [{ type: "text", text: `Error: ${result.error.message}` }] };
    }
    const secs = parseInt(result.result.timeInSecs, 10);
    return {
      content: [{ type: "text", text: `Next mev-commit opted-in block in ${secs} seconds.${secs <= 12 ? " Good time to send a transaction for preconfirmation!" : ""}` }],
    };
  }
);

server.tool(
  "mevcommit_cancelTransaction",
  "Cancel a pending preconfirmation attempt for a transaction. If commitments have already been obtained, the transaction may still land on-chain.",
  { txHash: z.string().describe("Transaction hash to cancel (0x...)") },
  async ({ txHash }) => {
    const result = await rpcCall("mevcommit_cancelTransaction", [txHash]);
    if (result.error) {
      return { content: [{ type: "text", text: `Error: ${result.error.message}` }] };
    }
    const r = result.result;
    return {
      content: [{ type: "text", text: `Transaction ${r.txHash}: ${r.cancelled ? "Successfully cancelled" : "Could not cancel (commitments may already exist)"}` }],
    };
  }
);

// --- x402 Facilitator Tools ---

server.tool(
  "x402_supported",
  "Check which payment assets and networks the x402 facilitator supports",
  {},
  async () => {
    const res = await fetch(`${FACILITATOR_URL}/supported`);
    const data = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "x402_verify",
  "Verify whether an x402 payment has been settled on-chain",
  {
    payload: z.string().describe("JSON string of the payment verification payload"),
  },
  async ({ payload }) => {
    const res = await fetch(`${FACILITATOR_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    const data = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// --- Start Server ---

const transport = new StdioServerTransport();
await server.connect(transport);
