export type EtherscanRequest = {
  chainid?: string
  module: string
  action: string
  method?: 'GET' | 'POST'
  params?: Record<string, string | number | boolean | undefined>
  baseUrl?: string
  noChain?: boolean
}

export type EtherscanResponse<T = unknown> = {
  status?: string
  message?: string
  result?: T
  attribution?: string
  [key: string]: unknown
}

export class EtherscanApiError extends Error {
  readonly status?: string
  readonly result?: unknown

  constructor(
    message: string,
    options: { status?: string; result?: unknown } = {},
  ) {
    super(message)
    this.name = 'EtherscanApiError'
    this.status = options.status
    this.result = options.result
  }
}

export class EtherscanClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly fetchImplementation: typeof fetch
  private readonly attribution: boolean

  constructor(options: {
    apiKey: string
    baseUrl?: string
    fetch?: typeof fetch
    attribution?: boolean
  }) {
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl ?? 'https://api.etherscan.io/v2/api'
    this.fetchImplementation = options.fetch ?? fetch
    this.attribution = options.attribution ?? true
  }

  async request<T = unknown>(
    request: EtherscanRequest,
  ): Promise<EtherscanResponse<T>> {
    const url = this.buildUrl(request)
    const response =
      request.method === 'POST'
        ? await this.fetchImplementation(url.origin + url.pathname, {
            method: 'POST',
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
            },
            body: url.searchParams,
          })
        : await this.fetchImplementation(url.toString())

    if (!response.ok) {
      throw new EtherscanApiError(`Etherscan HTTP ${response.status}`, {
        status: String(response.status),
      })
    }

    const payload = (await response.json()) as EtherscanResponse<T>

    if (payload.status === '0' && payload.message !== 'No transactions found') {
      throw new EtherscanApiError(String(payload.result ?? payload.message), {
        status: payload.status,
        result: payload.result,
      })
    }

    if (this.attribution) {
      return { ...payload, attribution: 'Data powered by Etherscan APIs' }
    }

    return payload
  }

  buildUrl(request: EtherscanRequest) {
    const url = new URL(request.baseUrl ?? this.baseUrl)
    url.searchParams.set('apikey', this.apiKey)
    if (!request.noChain)
      url.searchParams.set('chainid', request.chainid ?? '1')
    url.searchParams.set('module', request.module)
    url.searchParams.set('action', request.action)

    for (const [key, value] of Object.entries(request.params ?? {})) {
      if (value === undefined) continue
      url.searchParams.set(key, String(value))
    }

    return url
  }
}
