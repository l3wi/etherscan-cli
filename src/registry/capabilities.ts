import type {
  EndpointDefinition,
  EndpointGate,
  EndpointGroup,
  Plan,
} from '../types.js'

export type PlanLimits = {
  rps: number
  daily: number
  pro: boolean
}

const planOrder: Record<Plan, number> = {
  free: 0,
  lite: 1,
  standard: 2,
  advanced: 3,
  professional: 4,
  pro_plus: 5,
  enterprise: 6,
  custom: 6,
}

const gateMinimumPlan: Record<EndpointGate, Plan> = {
  free: 'free',
  pro: 'standard',
  pro_plus: 'pro_plus',
  enterprise: 'enterprise',
}

export function getPlanLimits(plan: Plan): PlanLimits {
  switch (plan) {
    case 'free':
      return { rps: 3, daily: 100000, pro: false }
    case 'lite':
      return { rps: 5, daily: 100000, pro: false }
    case 'standard':
      return { rps: 10, daily: 200000, pro: true }
    case 'advanced':
      return { rps: 20, daily: 500000, pro: true }
    case 'professional':
      return { rps: 30, daily: 1000000, pro: true }
    case 'pro_plus':
      return { rps: 30, daily: 1500000, pro: true }
    case 'enterprise':
    case 'custom':
      return { rps: 30, daily: 1500000, pro: true }
  }
}

export function endpointIsEnabled(
  endpoint: Pick<EndpointDefinition, 'gate'>,
  plan: Plan,
) {
  return planOrder[plan] >= planOrder[gateMinimumPlan[endpoint.gate]]
}

export function canUseChain(input: {
  plan: Plan
  chainId: string
  freeTierChains: Set<string>
  endpointGroup: EndpointGroup
}) {
  if (input.plan !== 'free') return { enabled: true }
  if (input.freeTierChains.has(input.chainId)) return { enabled: true }
  if (input.endpointGroup === 'contracts') return { enabled: true }
  return {
    enabled: false,
    reason: `Free API access is not documented for chain ${input.chainId}.`,
  }
}
