import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export type ChainMetadata = {
  chainname: string
  chainid: string
  blockexplorer: string
  apiurl: string
  status: 0 | 1 | 2
  comment?: string
}

export type ChainCache = {
  fetchedAt: string
  chains: ChainMetadata[]
}

export function getChainCachePath(home = homedir()) {
  return join(home, '.etherscan-cli', 'chains.json')
}

export async function loadChainCache(
  home = homedir(),
): Promise<ChainCache | undefined> {
  try {
    return JSON.parse(
      await readFile(getChainCachePath(home), 'utf8'),
    ) as ChainCache
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

export async function saveChainCache(cache: ChainCache, home = homedir()) {
  const path = getChainCachePath(home)
  await mkdir(dirname(path), { recursive: true, mode: 0o700 })
  await writeFile(path, `${JSON.stringify(cache, null, 2)}\n`, { mode: 0o600 })
}

export async function refreshChainCache(options: {
  fetch?: typeof fetch
  home?: string
}) {
  const fetchImplementation = options.fetch ?? fetch
  const response = await fetchImplementation(
    'https://api.etherscan.io/v2/chainlist',
  )
  if (!response.ok)
    throw new Error(`Etherscan chainlist HTTP ${response.status}`)
  const payload = (await response.json()) as { result?: ChainMetadata[] }
  const cache = {
    fetchedAt: new Date().toISOString(),
    chains: payload.result ?? [],
  }
  await saveChainCache(cache, options.home)
  return cache
}

export function chainCacheIsFresh(cache: ChainCache, ttlHours: number) {
  const fetchedAt = new Date(cache.fetchedAt).getTime()
  if (Number.isNaN(fetchedAt)) return false
  return Date.now() - fetchedAt < ttlHours * 60 * 60 * 1000
}
