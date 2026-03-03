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

The plugin registers `primev-fastrpc` as an MCP server pointing at `https://fastrpc.mev-commit.xyz`, giving agents direct JSON-RPC access to mev-commit's preconfirmation network on Ethereum mainnet.

## Quick Start

After installing, your Claude Code agent can:

- Send preconfirmed transactions: *"Send 0.1 ETH to 0x... through mev-commit"*
- Swap tokens instantly: *"Swap 1 WETH for USDC using Fast Protocol"*
- Pay for APIs with USDC: *"Access this x402-protected API endpoint"*
- Check gas tank balance: *"What's my mev-commit gas tank balance?"*

## Documentation

- [Primev Docs](https://docs.primev.xyz)
- [Primev AI](https://primev.xyz/ai)
- [mev-commit](https://mev-commit.xyz)

## License

MIT
