# Architecture Overview

`etherscan-cli` is registry-driven. Endpoint definitions describe command names, Etherscan modules/actions, parameters, plan gates, rate limits, docs URLs, examples, hints, and CTAs. The CLI layer turns those definitions into incur commands; the service layer builds and sends Etherscan requests.

The main split is:

- `commands`: incur command groups and user-facing command behavior.
- `services`: API client, request construction, errors, rate limiting, and response normalization.
- `config`: local config loading and saving.
- `registry`: endpoint and plan capability metadata.

Etherscan API V2 is the only first-class API surface.
