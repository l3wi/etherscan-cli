export type Plan =
  | 'free'
  | 'lite'
  | 'standard'
  | 'advanced'
  | 'professional'
  | 'pro_plus'
  | 'enterprise'
  | 'custom'

export type EndpointGate = 'free' | 'pro' | 'pro_plus' | 'enterprise'

export type Config = {
  apiKey?: string
  apiKeyEnv: string
  plan: Plan
  defaultChainId: string
  attribution: 'auto' | 'required' | 'disabled_for_private_use'
  chainCacheTtlHours: number
  allowDegradedChains: boolean
  rateLimit: {
    rps: 'auto' | number
    daily: 'auto' | number
  }
}

export type EndpointGroup =
  | 'account'
  | 'blocks'
  | 'contracts'
  | 'gas'
  | 'proxy'
  | 'logs'
  | 'stats'
  | 'transactions'
  | 'tokens'
  | 'l2'
  | 'nametags'
  | 'metadata'
  | 'usage'

export type EndpointParameter = {
  name: string
  description: string
  required?: boolean
  defaultValue?: string
  choices?: string[]
}

export type EndpointDefinition = {
  group: EndpointGroup
  command: string
  title: string
  description: string
  module: string
  action: string
  method?: 'GET' | 'POST'
  gate: EndpointGate
  params: EndpointParameter[]
  docsUrl: string
  hint: string
  examples: Array<{
    description: string
    args?: Record<string, string>
    options?: Record<string, string | number | boolean | string[]>
  }>
  ctas?: Array<{
    command: string
    description: string
  }>
  rateLimitRps?: number
  baseUrl?: string
  noChain?: boolean
}
