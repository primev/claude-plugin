# Primev Plugin for Claude Code

Primev infrastructure for Claude Code agents — preconfirmed transactions, gasless swaps, and agentic USDC payments on Ethereum.

## Install

```bash
claude plugin add primev/claude-plugin
```

## What's Included

**3 skills + 1 MCP server** that give your Claude Code agent native access to Primev infrastructure.

### Skills

| Skill | Description |
|-------|-------------|
| **mev-commit** | Send preconfirmed transactions through FAST RPC. Drop-in Ethereum JSON-RPC replacement with sub-second builder commitments and guaranteed inclusion. |
| **fast-protocol** | Execute instant token swaps on Ethereum. Gasless ERC-20 swaps via EIP-712 signed intents, or direct ETH swaps through FAST RPC. Settles on Uniswap V3. |
| **x402** | Agentic USDC payments over HTTP. Sign EIP-3009 authorizations, settle payments through the facilitator, and build pay-per-call APIs using HTTP 402. |

### MCP Server

The plugin registers `primev-fastrpc` as a stdio MCP server that wraps mev-commit's FAST RPC and x402 facilitator endpoints as native MCP tools. No API keys required — all endpoints are public.

**9 tools available:**

| Tool | Description |
|------|-------------|
| `eth_blockNumber` | Get current Ethereum block number |
| `eth_getBalance` | Get ETH balance of an address |
| `eth_gasPrice` | Get current gas price |
| `eth_getTransactionReceipt` | Check transaction status |
| `eth_sendRawTransaction` | Send a preconfirmed transaction |
| `eth_call` | Read-only contract call |
| `eth_chainId` | Get chain ID |
| `x402_supported` | Check supported x402 payment assets |
| `x402_verify` | Verify an x402 payment on-chain |

The MCP server runs locally via stdio — Claude Code spawns it as a subprocess. It makes HTTP calls to `https://fastrpc.mev-commit.xyz` and `https://facilitator.primev.xyz` on your behalf. No costs, no rate limits.

## Quick Start

After installing, your Claude Code agent can:

- Send preconfirmed transactions: *"Send 0.1 ETH to 0x... through mev-commit"*
- Check balances: *"What's my ETH balance?"*
- Swap tokens instantly: *"Swap 1 WETH for USDC using Fast Protocol"*
- Pay for APIs with USDC: *"Access this x402-protected API endpoint"*
- Query chain state: *"What's the current block number and gas price?"*

## Documentation

- [Primev Docs](https://docs.primev.xyz)
- [Primev AI](https://primev.xyz/ai)
- [mev-commit](https://mev-commit.xyz)

## License

MIT
