import { Cli, z } from 'incur'
import { loadConfigSync } from '../config.js'
import { endpointIsEnabled } from '../registry/capabilities.js'
import { endpoints } from '../registry/endpoints.js'
import type { EndpointDefinition, EndpointGroup } from '../types.js'
import { runEndpoint } from './shared.js'

const groupDescriptions: Record<EndpointGroup, string> = {
  account: 'Account balances, transactions, token transfers, and funding data.',
  blocks: 'Block rewards, countdowns, timestamps, and historical block stats.',
  contracts: 'Verified contract ABI, source, creation, and verification data.',
  gas: 'Gas oracle, confirmation estimates, and historical gas stats.',
  proxy: 'Geth/Parity proxy JSON-RPC compatible calls.',
  logs: 'Event log queries by block range, address, and topics.',
  stats: 'Network supply, price, node, size, and historical stats.',
  transactions: 'Transaction execution and receipt status checks.',
  tokens: 'Token balances, supply, holder, inventory, and token metadata.',
  l2: 'L2 deposit, withdrawal, and bridge transaction queries.',
  nametags: 'Pro Plus Etherscan nametag lookups.',
  metadata: 'Enterprise Etherscan metadata labels and exports.',
  usage: 'API usage and limit inspection.',
}

export function createGeneratedGroups() {
  const config = loadConfigSync()
  const groups = new Map<EndpointGroup, any>()
  const counts = new Map<EndpointGroup, number>()

  for (const group of Object.keys(groupDescriptions) as EndpointGroup[]) {
    groups.set(
      group,
      Cli.create(group, {
        description: groupDescriptions[group],
      }),
    )
  }

  for (const endpoint of endpoints) {
    if (!endpointIsEnabled(endpoint, config.plan)) continue
    const group = groups.get(endpoint.group)
    groups.set(endpoint.group, addEndpointCommand(group, endpoint))
    counts.set(endpoint.group, (counts.get(endpoint.group) ?? 0) + 1)
  }

  return [...groups.entries()]
    .filter(([group]) => (counts.get(group) ?? 0) > 0)
    .map(([, commandGroup]) => commandGroup)
}

function addEndpointCommand(group: any, endpoint: EndpointDefinition) {
  const requiredParams = endpoint.params.filter((param) => param.required)
  const optionParams = endpoint.params.filter((param) => !param.required)

  const argsShape = Object.fromEntries(
    requiredParams.map((param) => [
      param.name,
      z.string().describe(param.description),
    ]),
  )
  const optionsShape: Record<string, z.ZodType> = {
    apiKey: z.string().optional().describe('Etherscan API key override.'),
    chainid: z
      .string()
      .optional()
      .describe('Etherscan API V2 chain ID. Defaults to configured chain.'),
  }

  for (const param of optionParams) {
    const schema = z.string().optional().describe(param.description)
    optionsShape[param.name] =
      param.defaultValue === undefined
        ? schema
        : schema.default(param.defaultValue)
  }

  return group.command(endpoint.command, {
    description: endpoint.description,
    args: z.object(argsShape),
    options: z.object(optionsShape),
    output: z.any(),
    hint: `${endpoint.hint} Docs: ${endpoint.docsUrl}`,
    examples: endpoint.examples.map((example) => ({
      description: example.description,
      args: pickKnown(
        example.args ?? {},
        requiredParams.map((param) => param.name),
      ),
      options: {
        chainid: '1',
        ...pickKnown(
          example.options ?? {},
          optionParams.map((param) => param.name),
        ),
      },
    })),
    async run(context: any) {
      try {
        const result = await runEndpoint(endpoint, {
          ...context.args,
          ...context.options,
        })
        return context.ok(result, {
          cta: {
            commands: [
              ...(endpoint.ctas ?? []),
              {
                command: 'catalog',
                description: 'Inspect endpoint gates and docs links.',
              },
            ],
          },
        })
      } catch (error) {
        return context.error({
          code: 'ETHERSCAN_REQUEST_FAILED',
          message: error instanceof Error ? error.message : String(error),
          retryable: true,
          cta: {
            commands: [
              {
                command: 'setup',
                description: 'Configure an API key and subscription plan.',
              },
              {
                command: 'catalog',
                description: 'Check whether this endpoint is enabled.',
              },
            ],
          },
        })
      }
    },
  })
}

function pickKnown(
  values: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  return Object.fromEntries(
    keys
      .map((key) => [key, values[key]])
      .filter(([, value]) => value !== undefined),
  )
}
