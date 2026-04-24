# etherscan-cli

A first-class Etherscan API V2 CLI built with [incur](https://wevm-incur.mintlify.app/introduction).

## Install

```sh
bun install
bun run build
```

## Setup

```sh
bun run dev -- setup --apiKey YOUR_KEY --plan free --nonInteractive
```

The CLI reads API keys in this order:

1. `--apiKey`
2. `ETHERSCAN_API_KEY`
3. `~/.etherscan-cli/config.json`

## Examples

```sh
bun run dev -- account balance 0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae --chainid 1 --json
bun run dev -- contracts abi 0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413 --chainid 1
bun run dev -- raw account balance --param address=0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae
```

Free-tier public output includes Etherscan attribution by default.
