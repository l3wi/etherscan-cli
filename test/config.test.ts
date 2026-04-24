import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  getApiKey,
  getConfigPath,
  loadConfig,
  saveConfig,
} from '../src/config.js'

const temporaryDirectories: string[] = []

async function makeHome() {
  const directory = await mkdtemp(join(tmpdir(), 'etherscan-cli-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

describe('config', () => {
  it('uses ~/.etherscan-cli/config.json by default', () => {
    expect(getConfigPath('/tmp/home')).toBe(
      '/tmp/home/.etherscan-cli/config.json',
    )
  })

  it('saves and loads config json', async () => {
    const home = await makeHome()

    await saveConfig(
      {
        apiKey: 'key',
        apiKeyEnv: 'ETHERSCAN_API_KEY',
        plan: 'free',
        defaultChainId: '1',
        attribution: 'auto',
        chainCacheTtlHours: 24,
        allowDegradedChains: false,
        rateLimit: { rps: 'auto', daily: 'auto' },
      },
      home,
    )

    await expect(loadConfig(home)).resolves.toMatchObject({
      apiKey: 'key',
      plan: 'free',
      defaultChainId: '1',
    })
    await expect(readFile(getConfigPath(home), 'utf8')).resolves.toContain(
      '"apiKey": "key"',
    )
  })

  it('resolves api key precedence', () => {
    expect(
      getApiKey({
        optionApiKey: 'option',
        env: { ETHERSCAN_API_KEY: 'env' },
        config: { apiKey: 'config' },
      }),
    ).toBe('option')

    expect(
      getApiKey({
        env: { ETHERSCAN_API_KEY: 'env' },
        config: { apiKey: 'config' },
      }),
    ).toBe('env')

    expect(getApiKey({ env: {}, config: { apiKey: 'config' } })).toBe('config')
  })
})
