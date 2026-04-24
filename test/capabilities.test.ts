import { describe, expect, it } from 'vitest'
import {
  canUseChain,
  endpointIsEnabled,
  getPlanLimits,
} from '../src/registry/capabilities.js'

describe('capabilities', () => {
  it('maps documented rate limits by plan', () => {
    expect(getPlanLimits('free')).toEqual({ rps: 3, daily: 100000, pro: false })
    expect(getPlanLimits('standard')).toEqual({
      rps: 10,
      daily: 200000,
      pro: true,
    })
  })

  it('gates endpoints by tier', () => {
    expect(endpointIsEnabled({ gate: 'free' }, 'free')).toBe(true)
    expect(endpointIsEnabled({ gate: 'pro' }, 'free')).toBe(false)
    expect(endpointIsEnabled({ gate: 'pro' }, 'standard')).toBe(true)
    expect(endpointIsEnabled({ gate: 'pro_plus' }, 'professional')).toBe(false)
    expect(endpointIsEnabled({ gate: 'pro_plus' }, 'pro_plus')).toBe(true)
    expect(endpointIsEnabled({ gate: 'enterprise' }, 'pro_plus')).toBe(false)
    expect(endpointIsEnabled({ gate: 'enterprise' }, 'enterprise')).toBe(true)
  })

  it('allows free plan contract endpoints on paid-only chains', () => {
    expect(
      canUseChain({
        plan: 'free',
        chainId: '8453',
        freeTierChains: new Set(['1']),
        endpointGroup: 'contracts',
      }),
    ).toEqual({ enabled: true })

    expect(
      canUseChain({
        plan: 'free',
        chainId: '8453',
        freeTierChains: new Set(['1']),
        endpointGroup: 'account',
      }),
    ).toEqual({
      enabled: false,
      reason: 'Free API access is not documented for chain 8453.',
    })
  })
})
