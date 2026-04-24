import { describe, expect, it, vi } from 'vitest'
import { EtherscanApiError, EtherscanClient } from '../src/services/client.js'

describe('EtherscanClient', () => {
  it('builds V2 query requests', async () => {
    const fetch = vi.fn(async () =>
      Response.json({ status: '1', message: 'OK', result: '42' }),
    )
    const client = new EtherscanClient({ apiKey: 'secret', fetch })

    await expect(
      client.request({
        chainid: '1',
        module: 'account',
        action: 'balance',
        params: { address: '0xabc', tag: 'latest' },
      }),
    ).resolves.toEqual({
      status: '1',
      message: 'OK',
      result: '42',
      attribution: 'Data powered by Etherscan APIs',
    })

    const url = new URL(fetch.mock.calls[0]?.[0] as string)
    expect(url.origin + url.pathname).toBe('https://api.etherscan.io/v2/api')
    expect(url.searchParams.get('apikey')).toBe('secret')
    expect(url.searchParams.get('chainid')).toBe('1')
    expect(url.searchParams.get('module')).toBe('account')
    expect(url.searchParams.get('action')).toBe('balance')
    expect(url.searchParams.get('address')).toBe('0xabc')
  })

  it('normalizes Etherscan status errors', async () => {
    const fetch = vi.fn(async () =>
      Response.json({
        status: '0',
        message: 'NOTOK',
        result: 'Invalid API Key',
      }),
    )
    const client = new EtherscanClient({ apiKey: 'bad', fetch })

    await expect(
      client.request({
        chainid: '1',
        module: 'account',
        action: 'balance',
        params: { address: '0xabc' },
      }),
    ).rejects.toBeInstanceOf(EtherscanApiError)
  })

  it('sends POST requests as form-encoded Etherscan params', async () => {
    const fetch = vi.fn(async () =>
      Response.json({ status: '1', message: 'OK', result: 'guid' }),
    )
    const client = new EtherscanClient({ apiKey: 'secret', fetch })

    await client.request({
      chainid: '1',
      module: 'contract',
      action: 'verifysourcecode',
      method: 'POST',
      params: { contractaddress: '0xabc', sourceCode: 'contract A {}' },
    })

    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.etherscan.io/v2/api')
    const init = fetch.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body?.toString()).toContain('module=contract')
    expect(init.body?.toString()).toContain('action=verifysourcecode')
    expect(init.body?.toString()).toContain('contractaddress=0xabc')
  })
})
