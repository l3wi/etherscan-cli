import { Cli, z } from 'incur'
import {
  defaultConfig,
  getConfigPath,
  loadConfig,
  saveConfig,
} from './config.js'
import { endpointIsEnabled, getPlanLimits } from './registry/capabilities.js'
import { endpoints, findEndpoint } from './registry/endpoints.js'
import {
  chainCacheIsFresh,
  getChainCachePath,
  loadChainCache,
  refreshChainCache,
} from './services/chains.js'
import type { Plan } from './types.js'
import { createGeneratedGroups } from './commands/generated.js'
import {
  createClient,
  getRuntime,
  parseParamString,
} from './commands/shared.js'

const version = '0.1.0'

export const cli = Cli.create('etherscan', {
  version,
  description:
    'First-class Etherscan API V2 CLI with tier-aware commands and agent discovery.',
  sync: {
    suggestions: [
      'set up my Etherscan API key',
      'get the balance for an address on Ethereum mainnet',
      'list which Etherscan endpoints are available on my plan',
    ],
  },
})

cli.command('setup', {
  description:
    'Save Etherscan CLI configuration to ~/.etherscan-cli/config.json.',
  options: z.object({
    apiKey: z.string().optional().describe('Etherscan API key to save.'),
    apiKeyEnv: z
      .string()
      .default('ETHERSCAN_API_KEY')
      .describe('Environment variable name to check before saved config.'),
    plan: z
      .enum([
        'free',
        'lite',
        'standard',
        'advanced',
        'professional',
        'pro_plus',
        'enterprise',
        'custom',
      ])
      .default('free')
      .describe('Configured Etherscan API subscription tier.'),
    defaultChainId: z
      .string()
      .default('1')
      .describe('Default Etherscan chain ID.'),
    nonInteractive: z
      .boolean()
      .default(false)
      .describe('Fail instead of prompting when required inputs are missing.'),
  }),
  output: z.object({
    path: z.string(),
    plan: z.string(),
    defaultChainId: z.string(),
    apiKeySaved: z.boolean(),
    apiKeyEnv: z.string(),
  }),
  hint: 'For shared machines, prefer ETHERSCAN_API_KEY. This command can save a key locally when explicitly provided.',
  examples: [
    {
      options: {
        apiKey: 'YourApiKeyToken',
        plan: 'free',
        defaultChainId: '1',
        nonInteractive: true,
      },
      description: 'Save a Free-tier mainnet config.',
    },
  ],
  async run(context) {
    if (!context.options.apiKey && context.options.nonInteractive) {
      return context.error({
        code: 'MISSING_API_KEY',
        message: 'Pass --apiKey or omit --nonInteractive.',
        retryable: false,
      })
    }

    const config = {
      ...defaultConfig,
      apiKey: context.options.apiKey,
      apiKeyEnv: context.options.apiKeyEnv,
      plan: context.options.plan as Plan,
      defaultChainId: context.options.defaultChainId,
    }
    await saveConfig(config)

    return context.ok(
      {
        path: getConfigPath(),
        plan: config.plan,
        defaultChainId: config.defaultChainId,
        apiKeySaved: Boolean(config.apiKey),
        apiKeyEnv: config.apiKeyEnv,
      },
      {
        cta: {
          commands: [
            {
              command: 'chains refresh',
              description: 'Refresh supported chain metadata.',
            },
            {
              command: 'catalog',
              description: 'See endpoints enabled for this plan.',
            },
          ],
        },
      },
    )
  },
})

const config = Cli.create('config', {
  description: 'Inspect and manage local Etherscan CLI config.',
})
  .command('path', {
    description: 'Print config file path.',
    output: z.object({ path: z.string() }),
    run() {
      return { path: getConfigPath() }
    },
  })
  .command('get', {
    description: 'Print config with API key redacted.',
    output: z.any(),
    async run() {
      const loaded = await loadConfig()
      return {
        ...loaded,
        apiKey: loaded.apiKey ? '<redacted>' : undefined,
        path: getConfigPath(),
      }
    },
  })
  .command('set', {
    description: 'Set a supported config key.',
    args: z.object({
      key: z.string().describe('Config key such as plan or defaultChainId.'),
      value: z.string().describe('Value to write.'),
    }),
    output: z.any(),
    async run(context) {
      const loaded = await loadConfig()
      const next = { ...loaded }
      if (context.args.key === 'plan') next.plan = context.args.value as Plan
      else if (context.args.key === 'defaultChainId')
        next.defaultChainId = context.args.value
      else if (context.args.key === 'apiKeyEnv')
        next.apiKeyEnv = context.args.value
      else {
        return context.error({
          code: 'UNSUPPORTED_CONFIG_KEY',
          message: 'Supported keys: plan, defaultChainId, apiKeyEnv.',
          retryable: false,
        })
      }
      await saveConfig(next)
      return {
        key: context.args.key,
        value: context.args.value,
        path: getConfigPath(),
      }
    },
  })

cli.command(config)

const chains = Cli.create('chains', {
  description: 'Supported chain cache and discovery commands.',
})
  .command('refresh', {
    description: 'Refresh supported chains from Etherscan.',
    output: z.any(),
    async run() {
      const cache = await refreshChainCache({})
      return {
        path: getChainCachePath(),
        fetchedAt: cache.fetchedAt,
        chains: cache.chains.length,
      }
    },
  })
  .command('list', {
    description:
      'List cached supported chains, refreshing stale cache when possible.',
    output: z.any(),
    async run() {
      const configured = await loadConfig()
      const existing = await loadChainCache()
      const cache =
        existing && chainCacheIsFresh(existing, configured.chainCacheTtlHours)
          ? existing
          : await refreshChainCache({}).catch(() => existing)
      return {
        path: getChainCachePath(),
        fetchedAt: cache?.fetchedAt,
        chains: cache?.chains ?? [],
      }
    },
  })
  .command('get', {
    description: 'Get cached chain metadata by chain ID.',
    args: z.object({ chainid: z.string().describe('Chain ID to inspect.') }),
    output: z.any(),
    async run(context) {
      const cache = await loadChainCache()
      const chain = cache?.chains.find(
        (item) => item.chainid === context.args.chainid,
      )
      if (!chain) {
        return context.error({
          code: 'CHAIN_NOT_FOUND',
          message: 'Chain not found in cache. Run `etherscan chains refresh`.',
          retryable: false,
        })
      }
      return chain
    },
  })

cli.command(chains)

cli.command('catalog', {
  description: 'Show endpoint catalog and current plan gates.',
  options: z.object({
    group: z.string().optional().describe('Optional endpoint group filter.'),
  }),
  output: z.any(),
  async run(context) {
    const loaded = await loadConfig()
    return {
      plan: loaded.plan,
      limits: getPlanLimits(loaded.plan),
      endpoints: endpoints
        .filter(
          (endpoint) =>
            !context.options.group || endpoint.group === context.options.group,
        )
        .map((endpoint) => ({
          group: endpoint.group,
          command: endpoint.command,
          module: endpoint.module,
          action: endpoint.action,
          gate: endpoint.gate,
          enabled: endpointIsEnabled(endpoint, loaded.plan),
          docsUrl: endpoint.docsUrl,
          rateLimitRps: endpoint.rateLimitRps,
        })),
    }
  },
})

cli.command('raw', {
  description:
    'Call any Etherscan V2 module/action with comma-separated params.',
  args: z.object({
    module: z.string().describe('Etherscan module.'),
    action: z.string().describe('Etherscan action.'),
  }),
  options: z.object({
    params: z
      .string()
      .optional()
      .describe(
        'Comma-separated key=value params, for example address=0xabc,tag=latest.',
      ),
    apiKey: z.string().optional().describe('Etherscan API key override.'),
    chainid: z.string().optional().describe('Etherscan API V2 chain ID.'),
    forceGated: z
      .boolean()
      .default(false)
      .describe('Allow a known gated endpoint and return the API response.'),
  }),
  output: z.any(),
  async run(context) {
    const known = endpoints.find(
      (endpoint) =>
        endpoint.module === context.args.module &&
        endpoint.action === context.args.action,
    )
    const {
      config: loaded,
      apiKey,
      chainid,
    } = await getRuntime(context.options)
    if (!apiKey) {
      return context.error({
        code: 'MISSING_API_KEY',
        message: 'Missing Etherscan API key. Run `etherscan setup`.',
        retryable: false,
      })
    }
    if (
      known &&
      !context.options.forceGated &&
      !endpointIsEnabled(known, loaded.plan)
    ) {
      return context.error({
        code: 'ENDPOINT_GATED',
        message: `Endpoint requires ${known.gate}; current plan is ${loaded.plan}.`,
        retryable: false,
      })
    }
    return createClient(apiKey, loaded).request({
      chainid,
      module: context.args.module,
      action: context.args.action,
      method: known?.method,
      params: parseParamString(context.options.params),
      baseUrl: known?.baseUrl,
      noChain: known?.noChain,
    })
  },
})

for (const group of createGeneratedGroups()) cli.command(group)

export function getEndpointForCommand(group: string, command: string) {
  return findEndpoint(group as never, command)
}
