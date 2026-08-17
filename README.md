# Primev Plugin

Opt Ethereum L1 validator keys into the mev-commit validator coalition from Claude Code, Grok, or ChatGPT.

## Install

Claude:

```bash
claude plugin marketplace add primev/claude-plugin
claude plugin install primev
```

Grok:

```bash
grok plugin marketplace add primev/claude-plugin
grok plugin install primev --trust
```

ChatGPT / Codex: open https://primev.xyz/skills/mev-commit-opt-in.md and add it as a skill.

## Skill

**mev-commit-opt-in** registers keys into the coalition roster: vanilla, EigenLayer, or Symbiotic. Parse `.txt` / `.csv` BLS keys, simulate and send on the operator's RPC and wallet (or hand-hold a Safe / multi-sig propose → sign → execute), verify on ValidatorOptInHub, compute real on-chain ETH stake, and opt out. Do not describe this as extra yield from a live bid market. Done means Hub `true`, not a receipt.

Any mev-boost relay set is fine. There is no relay configuration step.

The old validator dashboard is deprecated. Use this skill: https://primev.xyz/ai

## MCP

- `primev-docs` (HTTP): search https://docs.primev.xyz
- `primev-fastrpc` (stdio): read/status helpers, including `mevcommit_optInBlock` (time until the next opted-in proposer). This does not register keys.

## Docs

- https://docs.primev.xyz/v1.2.x/knowledge-base/why-should-validators-opt-in
- https://docs.primev.xyz/v1.2.x/get-started/validators/agentic-opt-in
- https://primev.xyz/ai

## License

MIT
