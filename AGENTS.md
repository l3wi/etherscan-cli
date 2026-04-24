# etherscan-cli Instructions

This repository builds a TypeScript CLI with Bun, Vitest, and incur.

- Prefer TDD for new behavior.
- Keep Etherscan endpoint definitions registry-driven.
- Do not add Etherscan API V1 compatibility unless explicitly requested.
- Do not print API keys in logs, test output, or docs examples.
- Tests must mock network access by default.
