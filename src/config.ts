import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { Config, Plan } from './types.js'

export const defaultConfig: Config = {
  apiKeyEnv: 'ETHERSCAN_API_KEY',
  plan: 'free',
  defaultChainId: '1',
  attribution: 'auto',
  chainCacheTtlHours: 24,
  allowDegradedChains: false,
  rateLimit: { rps: 'auto', daily: 'auto' },
}

export function getConfigPath(home = homedir()) {
  return join(home, '.etherscan-cli', 'config.json')
}

export async function loadConfig(home = homedir()): Promise<Config> {
  try {
    const content = await readFile(getConfigPath(home), 'utf8')
    const parsed = JSON.parse(content) as Partial<Config>
    return normalizeConfig(parsed)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return defaultConfig
    throw error
  }
}

export function loadConfigSync(home = homedir()): Config {
  const path = getConfigPath(home)
  if (!existsSync(path)) return defaultConfig
  return normalizeConfig(
    JSON.parse(readFileSync(path, 'utf8')) as Partial<Config>,
  )
}

export async function saveConfig(config: Config, home = homedir()) {
  const path = getConfigPath(home)
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  await writeFile(
    path,
    `${JSON.stringify(normalizeConfig(config), null, 2)}\n`,
    {
      mode: 0o600,
    },
  )
}

export function normalizeConfig(config: Partial<Config>): Config {
  return {
    ...defaultConfig,
    ...config,
    apiKeyEnv: config.apiKeyEnv ?? defaultConfig.apiKeyEnv,
    plan: normalizePlan(config.plan),
    defaultChainId: String(
      config.defaultChainId ?? defaultConfig.defaultChainId,
    ),
    attribution: config.attribution ?? defaultConfig.attribution,
    chainCacheTtlHours:
      config.chainCacheTtlHours ?? defaultConfig.chainCacheTtlHours,
    allowDegradedChains:
      config.allowDegradedChains ?? defaultConfig.allowDegradedChains,
    rateLimit: {
      ...defaultConfig.rateLimit,
      ...config.rateLimit,
    },
  }
}

export function normalizePlan(plan: unknown): Plan {
  const plans = new Set<Plan>([
    'free',
    'lite',
    'standard',
    'advanced',
    'professional',
    'pro_plus',
    'enterprise',
    'custom',
  ])
  return typeof plan === 'string' && plans.has(plan as Plan)
    ? (plan as Plan)
    : 'free'
}

export function getApiKey(input: {
  optionApiKey?: string
  env: Record<string, string | undefined>
  config: Partial<Config>
}) {
  if (input.optionApiKey) return input.optionApiKey
  const envName = input.config.apiKeyEnv ?? defaultConfig.apiKeyEnv
  if (input.env[envName]) return input.env[envName]
  return input.config.apiKey
}
