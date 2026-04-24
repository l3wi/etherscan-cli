import { getApiKey, loadConfig } from '../config.js'
import {
  canUseChain,
  endpointIsEnabled,
  getPlanLimits,
} from '../registry/capabilities.js'
import { freeTierChainIds } from '../registry/free-tier-chains.js'
import { EtherscanClient } from '../services/client.js'
import { RateLimiter } from '../services/rate-limit.js'
import type { Config, EndpointDefinition } from '../types.js'

export type RuntimeOptions = {
  apiKey?: string
  chainid?: string
}

export async function getRuntime(options: RuntimeOptions) {
  const config = await loadConfig()
  const apiKey = getApiKey({
    optionApiKey: options.apiKey,
    env: process.env,
    config,
  })

  return { config, apiKey, chainid: options.chainid ?? config.defaultChainId }
}

export function createClient(apiKey: string, config: Config) {
  return new EtherscanClient({
    apiKey,
    attribution:
      config.attribution === 'required' ||
      (config.attribution === 'auto' && config.plan === 'free'),
  })
}

export async function runEndpoint(
  endpoint: EndpointDefinition,
  options: RuntimeOptions & Record<string, unknown>,
) {
  const { config, apiKey, chainid } = await getRuntime(options)
  if (!apiKey) {
    throw new Error(
      'Missing Etherscan API key. Run `etherscan setup` or set ETHERSCAN_API_KEY.',
    )
  }

  if (!endpointIsEnabled(endpoint, config.plan)) {
    throw new Error(
      `Endpoint requires ${endpoint.gate}; current configured plan is ${config.plan}.`,
    )
  }

  const chainGate = canUseChain({
    plan: config.plan,
    chainId: chainid,
    freeTierChains: freeTierChainIds,
    endpointGroup: endpoint.group,
  })
  if (!chainGate.enabled) throw new Error(chainGate.reason)

  const params = Object.fromEntries(
    endpoint.params
      .map((param) => [param.name, options[param.name] ?? param.defaultValue])
      .filter(([, value]) => value !== undefined && value !== ''),
  ) as Record<string, string | number | boolean>

  const limiter = new RateLimiter(
    endpoint.rateLimitRps ?? getPlanLimits(config.plan).rps,
  )
  await limiter.wait()

  return createClient(apiKey, config).request({
    chainid,
    module: endpoint.module,
    action: endpoint.action,
    method: endpoint.method,
    params,
    baseUrl: endpoint.baseUrl,
    noChain: endpoint.noChain,
  })
}

export function parseParamString(params?: string) {
  if (!params) return {}
  return Object.fromEntries(
    params
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...valueParts] = part.split('=')
        return [key, valueParts.join('=')]
      }),
  )
}
