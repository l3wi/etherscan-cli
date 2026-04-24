# @lewi/etherscan-cli

A first-class Etherscan API V2 CLI built with [incur](https://wevm-incur.mintlify.app/introduction).

## Install

Install globally from npm:

```sh
npm install -g @lewi/etherscan-cli
```

Or run without installing:

```sh
npx @lewi/etherscan-cli --help
```

For local development:

```sh
bun install
bun run build
```

## Setup

```sh
etherscan setup --api-key YOUR_KEY --plan free --non-interactive
```

The CLI reads API keys in this order:

1. `--api-key`
2. `ETHERSCAN_API_KEY`
3. `~/.etherscan-cli/config.json`

## Examples

```sh
etherscan account balance 0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae --chainid 1 --json
etherscan contracts abi 0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413 --chainid 1
etherscan raw account balance --params address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae,tag=latest
etherscan catalog --json
```

## Agent Integrations

The CLI uses incur, so it can expose the command surface to agents.

Print the CLI skill/manifest:

```sh
etherscan --llms
```

Install the generated skill into supported local agents:

```sh
etherscan skills add
```

Register the CLI as an MCP server:

```sh
etherscan mcp add
```

Start MCP stdio mode directly:

```sh
etherscan --mcp
```

Free-tier public output includes Etherscan attribution by default.
