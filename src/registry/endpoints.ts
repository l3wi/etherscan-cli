import type {
  EndpointDefinition,
  EndpointGate,
  EndpointGroup,
} from '../types.js'

const docs = 'https://docs.etherscan.io/api-reference/endpoint'

function endpoint(input: {
  group: EndpointGroup
  command: string
  title: string
  description: string
  module: string
  action: string
  method?: 'GET' | 'POST'
  gate?: EndpointGate
  params?: EndpointDefinition['params']
  docsSlug: string
  hint?: string
  rateLimitRps?: number
  baseUrl?: string
  noChain?: boolean
}): EndpointDefinition {
  return {
    gate: 'free',
    params: [],
    hint:
      input.hint ??
      'Use --chainid to query any supported Etherscan API V2 chain.',
    examples: [
      {
        description: input.title,
        args: Object.fromEntries(
          (input.params ?? [])
            .filter((param) => param.required)
            .map((param) => [param.name, placeholderFor(param.name)]),
        ),
        options: Object.fromEntries(
          (input.params ?? [])
            .filter((param) => param.defaultValue !== undefined)
            .map((param) => [param.name, param.defaultValue as string]),
        ),
      },
    ],
    docsUrl: `${docs}/${input.docsSlug}`,
    ...input,
  }
}

function placeholderFor(name: string) {
  if (name.includes('address'))
    return '0x0000000000000000000000000000000000000000'
  if (name === 'txhash') {
    return '0x0000000000000000000000000000000000000000000000000000000000000000'
  }
  if (name === 'blockno') return '2165403'
  if (name === 'timestamp') return '1578638524'
  if (name === 'gasprice') return '2000000000'
  return `<${name}>`
}

const address = {
  name: 'address',
  required: true,
  description: 'Address to query.',
}

const contractaddress = {
  name: 'contractaddress',
  required: true,
  description: 'Token or contract address.',
}

const txhash = {
  name: 'txhash',
  required: true,
  description: 'Transaction hash.',
}

const pagination = [
  {
    name: 'page',
    description: 'Page number for paginated endpoints.',
    defaultValue: '1',
  },
  {
    name: 'offset',
    description: 'Records per page.',
    defaultValue: '100',
  },
  {
    name: 'sort',
    description: 'Sort order.',
    defaultValue: 'asc',
    choices: ['asc', 'desc'],
  },
]

const blockRange = [
  {
    name: 'startblock',
    description: 'Starting block number.',
    defaultValue: '0',
  },
  {
    name: 'endblock',
    description: 'Ending block number.',
    defaultValue: '999999999',
  },
]

const dateRange = [
  {
    name: 'startdate',
    description: 'Start date in yyyy-MM-dd format.',
    required: true,
  },
  {
    name: 'enddate',
    description: 'End date in yyyy-MM-dd format.',
    required: true,
  },
  {
    name: 'sort',
    description: 'Sort order.',
    defaultValue: 'asc',
    choices: ['asc', 'desc'],
  },
]

export const endpoints: EndpointDefinition[] = [
  endpoint({
    group: 'account',
    command: 'balance',
    title: 'Get native balance',
    description:
      'Retrieves the native token balance for one or more addresses.',
    module: 'account',
    action: 'balance',
    docsSlug: 'balance',
    params: [
      address,
      {
        name: 'tag',
        description: 'Use latest or a recent hex block tag.',
        defaultValue: 'latest',
      },
    ],
  }),
  endpoint({
    group: 'account',
    command: 'historical-balance',
    title: 'Get historical native balance',
    description: 'Retrieves native balance at a historical block.',
    module: 'account',
    action: 'balancehistory',
    gate: 'pro',
    rateLimitRps: 2,
    docsSlug: 'balancehistory',
    params: [
      address,
      { name: 'blockno', required: true, description: 'Block number.' },
    ],
  }),
  endpoint({
    group: 'account',
    command: 'txs',
    title: 'Get normal transactions',
    description: 'Lists normal transactions by address.',
    module: 'account',
    action: 'txlist',
    docsSlug: 'txlist',
    params: [address, ...blockRange, ...pagination],
  }),
  endpoint({
    group: 'account',
    command: 'erc20-transfers',
    title: 'Get ERC20 transfers',
    description:
      'Lists ERC20 token transfers by address and optional token contract.',
    module: 'account',
    action: 'tokentx',
    docsSlug: 'tokentx',
    params: [
      address,
      { ...contractaddress, required: false },
      ...blockRange,
      ...pagination,
    ],
  }),
  endpoint({
    group: 'account',
    command: 'erc721-transfers',
    title: 'Get ERC721 transfers',
    description: 'Lists ERC721 token transfers by address.',
    module: 'account',
    action: 'tokennfttx',
    docsSlug: 'tokennfttx',
    params: [address, { ...contractaddress, required: false }, ...pagination],
  }),
  endpoint({
    group: 'account',
    command: 'erc1155-transfers',
    title: 'Get ERC1155 transfers',
    description: 'Lists ERC1155 token transfers by address.',
    module: 'account',
    action: 'token1155tx',
    docsSlug: 'token1155tx',
    params: [address, { ...contractaddress, required: false }, ...pagination],
  }),
  endpoint({
    group: 'account',
    command: 'internal-txs',
    title: 'Get internal transactions',
    description: 'Lists internal transactions by address.',
    module: 'account',
    action: 'txlistinternal',
    docsSlug: 'txlistinternal',
    params: [address, ...blockRange, ...pagination],
  }),
  endpoint({
    group: 'account',
    command: 'mined-blocks',
    title: 'Get blocks validated by address',
    description: 'Lists blocks validated by an address.',
    module: 'account',
    action: 'getminedblocks',
    docsSlug: 'getminedblocks',
    params: [
      address,
      {
        name: 'blocktype',
        description: 'blocks or uncles.',
        defaultValue: 'blocks',
      },
      ...pagination,
    ],
  }),
  endpoint({
    group: 'account',
    command: 'beacon-withdrawals',
    title: 'Get beacon withdrawals',
    description: 'Lists beacon chain withdrawals by address.',
    module: 'account',
    action: 'txsBeaconWithdrawal',
    docsSlug: 'txsbeaconwithdrawal',
    params: [address, ...pagination],
  }),
  endpoint({
    group: 'account',
    command: 'funded-by',
    title: 'Get address funded by',
    description: 'Finds the funding source for an address.',
    module: 'account',
    action: 'fundedby',
    gate: 'pro',
    rateLimitRps: 2,
    docsSlug: 'fundedby',
    params: [address],
  }),
  endpoint({
    group: 'blocks',
    command: 'reward',
    title: 'Get block reward',
    description: 'Retrieves block and uncle rewards by block number.',
    module: 'block',
    action: 'getblockreward',
    docsSlug: 'getblockreward',
    params: [{ name: 'blockno', required: true, description: 'Block number.' }],
  }),
  endpoint({
    group: 'blocks',
    command: 'countdown',
    title: 'Get block countdown',
    description: 'Estimates time remaining until a target block.',
    module: 'block',
    action: 'getblockcountdown',
    docsSlug: 'getblockcountdown',
    params: [{ name: 'blockno', required: true, description: 'Target block.' }],
  }),
  endpoint({
    group: 'blocks',
    command: 'by-time',
    title: 'Get block by timestamp',
    description: 'Finds closest block number for a Unix timestamp.',
    module: 'block',
    action: 'getblocknobytime',
    docsSlug: 'getblocknobytime',
    params: [
      { name: 'timestamp', required: true, description: 'Unix timestamp.' },
      {
        name: 'closest',
        description: 'Closest block direction.',
        defaultValue: 'before',
        choices: ['before', 'after'],
      },
    ],
  }),
  ...[
    ['daily-avg-size', 'dailyavgblocksize', 'Get daily average block size'],
    ['daily-count', 'dailyblkcount', 'Get daily block count and rewards'],
    ['daily-rewards', 'dailyblockrewards', 'Get daily block rewards'],
    ['daily-avg-time', 'dailyavgblocktime', 'Get daily average block time'],
    ['daily-uncles', 'dailyuncleblkcount', 'Get daily uncle block count'],
  ].map(([command, action, title]) =>
    endpoint({
      group: 'blocks',
      command,
      title,
      description: title,
      module: 'stats',
      action,
      gate: 'pro',
      docsSlug: action,
      params: dateRange,
    }),
  ),
  endpoint({
    group: 'contracts',
    command: 'abi',
    title: 'Get contract ABI',
    description: 'Retrieves ABI for a verified contract.',
    module: 'contract',
    action: 'getabi',
    docsSlug: 'getabi',
    params: [address],
  }),
  endpoint({
    group: 'contracts',
    command: 'source',
    title: 'Get contract source',
    description: 'Retrieves source code for a verified contract.',
    module: 'contract',
    action: 'getsourcecode',
    docsSlug: 'getsourcecode',
    params: [address],
  }),
  endpoint({
    group: 'contracts',
    command: 'creation',
    title: 'Get contract creation',
    description: 'Retrieves deployer and creation transaction data.',
    module: 'contract',
    action: 'getcontractcreation',
    docsSlug: 'getcontractcreation',
    params: [
      {
        name: 'contractaddresses',
        required: true,
        description: 'Comma-separated contract addresses.',
      },
    ],
  }),
  endpoint({
    group: 'contracts',
    command: 'verify-source',
    title: 'Verify Solidity source code',
    description: 'Submits Solidity source code verification for a contract.',
    module: 'contract',
    action: 'verifysourcecode',
    method: 'POST',
    docsSlug: 'verifysourcecode',
    hint: 'Verification returns a GUID. Use contracts check-verify with that GUID to poll status.',
    params: [
      {
        name: 'contractaddress',
        required: true,
        description: 'Contract address.',
      },
      {
        name: 'sourceCode',
        required: true,
        description: 'Solidity source code or standard JSON input.',
      },
      {
        name: 'codeformat',
        description: 'solidity-single-file or solidity-standard-json-input.',
        defaultValue: 'solidity-single-file',
      },
      {
        name: 'contractname',
        required: true,
        description:
          'Contract name, or file.sol:ContractName for standard JSON.',
      },
      {
        name: 'compilerversion',
        required: true,
        description: 'Solidity compiler version.',
      },
      {
        name: 'optimizationUsed',
        description: '0 for disabled, 1 for enabled.',
        defaultValue: '0',
      },
      { name: 'runs', description: 'Optimizer runs.', defaultValue: '200' },
      {
        name: 'constructorArguements',
        description: 'ABI-encoded constructor arguments without 0x.',
      },
      {
        name: 'evmversion',
        description: 'EVM version.',
        defaultValue: 'default',
      },
      {
        name: 'licenseType',
        description: 'Etherscan license type.',
        defaultValue: '1',
      },
    ],
  }),
  endpoint({
    group: 'contracts',
    command: 'verify-vyper',
    title: 'Verify Vyper source code',
    description: 'Submits Vyper source code verification for a contract.',
    module: 'contract',
    action: 'verifysourcecode',
    method: 'POST',
    docsSlug: 'verify-vyper-source-code',
    params: [
      {
        name: 'contractaddress',
        required: true,
        description: 'Contract address.',
      },
      { name: 'sourceCode', required: true, description: 'Vyper source code.' },
      { name: 'contractname', required: true, description: 'Contract name.' },
      {
        name: 'compilerversion',
        required: true,
        description: 'Vyper compiler version.',
      },
      {
        name: 'licenseType',
        description: 'Etherscan license type.',
        defaultValue: '1',
      },
    ],
  }),
  endpoint({
    group: 'contracts',
    command: 'verify-stylus',
    title: 'Verify Stylus contract',
    description: 'Submits Stylus contract verification where supported.',
    module: 'contract',
    action: 'verifysourcecode',
    method: 'POST',
    docsSlug: 'verify-stylus-source-code',
    params: [
      {
        name: 'contractaddress',
        required: true,
        description: 'Contract address.',
      },
      {
        name: 'sourceCode',
        required: true,
        description: 'Stylus source payload.',
      },
      { name: 'contractname', required: true, description: 'Contract name.' },
      {
        name: 'compilerversion',
        required: true,
        description: 'Compiler version.',
      },
      {
        name: 'licenseType',
        description: 'Etherscan license type.',
        defaultValue: '1',
      },
    ],
  }),
  endpoint({
    group: 'contracts',
    command: 'verify-zksync',
    title: 'Verify zkSync contract',
    description: 'Submits zkSync contract verification where supported.',
    module: 'contract',
    action: 'verifysourcecode',
    method: 'POST',
    docsSlug: 'verify-zksync-source-code',
    params: [
      {
        name: 'contractaddress',
        required: true,
        description: 'Contract address.',
      },
      {
        name: 'sourceCode',
        required: true,
        description: 'zkSync source payload.',
      },
      { name: 'contractname', required: true, description: 'Contract name.' },
      {
        name: 'compilerversion',
        required: true,
        description: 'Compiler version.',
      },
      {
        name: 'licenseType',
        description: 'Etherscan license type.',
        defaultValue: '1',
      },
    ],
  }),
  endpoint({
    group: 'contracts',
    command: 'verify-proxy',
    title: 'Verify proxy contract',
    description: 'Submits proxy contract verification.',
    module: 'contract',
    action: 'verifyproxycontract',
    method: 'POST',
    docsSlug: 'verifyproxycontract',
    params: [
      {
        name: 'address',
        required: true,
        description: 'Proxy contract address.',
      },
      {
        name: 'expectedimplementation',
        description: 'Optional expected implementation address.',
      },
    ],
  }),
  endpoint({
    group: 'contracts',
    command: 'check-verify',
    title: 'Check source verification status',
    description: 'Checks source verification submission status by GUID.',
    module: 'contract',
    action: 'checkverifystatus',
    docsSlug: 'checkverifystatus',
    params: [
      { name: 'guid', required: true, description: 'Verification GUID.' },
    ],
  }),
  endpoint({
    group: 'contracts',
    command: 'check-proxy',
    title: 'Check proxy verification status',
    description: 'Checks proxy verification submission status by GUID.',
    module: 'contract',
    action: 'checkproxyverification',
    docsSlug: 'checkproxyverification',
    params: [
      { name: 'guid', required: true, description: 'Proxy verification GUID.' },
    ],
  }),
  endpoint({
    group: 'gas',
    command: 'oracle',
    title: 'Get gas oracle',
    description: 'Gets current gas oracle recommendations.',
    module: 'gastracker',
    action: 'gasoracle',
    docsSlug: 'gasoracle',
  }),
  endpoint({
    group: 'gas',
    command: 'estimate',
    title: 'Estimate confirmation time',
    description: 'Estimates confirmation seconds for a gas price.',
    module: 'gastracker',
    action: 'gasestimate',
    docsSlug: 'gasestimate',
    params: [
      { name: 'gasprice', required: true, description: 'Gas price in wei.' },
    ],
  }),
  ...[
    ['daily-avg-limit', 'dailyavggaslimit', 'Get daily average gas limit'],
    ['daily-used', 'dailygasused', 'Get daily total gas used'],
    ['daily-avg-price', 'dailyavggasprice', 'Get daily average gas price'],
  ].map(([command, action, title]) =>
    endpoint({
      group: 'gas',
      command,
      title,
      description: title,
      module: 'stats',
      action,
      gate: 'pro',
      docsSlug: action,
      params: dateRange,
    }),
  ),
  ...[
    ['block-number', 'eth_blockNumber', 'Get latest block number'],
    ['gas-price', 'eth_gasPrice', 'Get gas price'],
  ].map(([command, action, title]) =>
    endpoint({
      group: 'proxy',
      command,
      title,
      description: title,
      module: 'proxy',
      action,
      docsSlug: action.toLowerCase(),
    }),
  ),
  ...[
    ['call', 'eth_call', ['to', 'data', 'tag']],
    [
      'estimate-gas',
      'eth_estimateGas',
      ['to', 'data', 'value', 'gas', 'gasPrice'],
    ],
    ['block-by-number', 'eth_getBlockByNumber', ['tag', 'boolean']],
    ['block-tx-count', 'eth_getBlockTransactionCountByNumber', ['tag']],
    ['code', 'eth_getCode', ['address', 'tag']],
    ['storage-at', 'eth_getStorageAt', ['address', 'position', 'tag']],
    [
      'tx-by-block-index',
      'eth_getTransactionByBlockNumberAndIndex',
      ['tag', 'index'],
    ],
    ['tx', 'eth_getTransactionByHash', ['txhash']],
    ['tx-count', 'eth_getTransactionCount', ['address', 'tag']],
    ['receipt', 'eth_getTransactionReceipt', ['txhash']],
    ['uncle', 'eth_getUncleByBlockNumberAndIndex', ['tag', 'index']],
    ['send-raw', 'eth_sendRawTransaction', ['hex']],
  ].map(([command, action, names]) =>
    endpoint({
      group: 'proxy',
      command: command as string,
      title: String(action),
      description: `Proxy JSON-RPC action ${String(action)}.`,
      module: 'proxy',
      action: action as string,
      docsSlug: String(action).toLowerCase(),
      params: (names as string[]).map((name) => ({
        name,
        required: !['tag', 'boolean'].includes(name),
        description: `${name} parameter.`,
        defaultValue:
          name === 'tag' ? 'latest' : name === 'boolean' ? 'true' : undefined,
      })),
    }),
  ),
  endpoint({
    group: 'logs',
    command: 'get',
    title: 'Get logs',
    description: 'Retrieves logs by address, block range, and topics.',
    module: 'logs',
    action: 'getLogs',
    docsSlug: 'getlogs',
    params: [
      { name: 'fromBlock', description: 'Start block.', defaultValue: '0' },
      { name: 'toBlock', description: 'End block.', defaultValue: 'latest' },
      { ...address, required: false },
      ...['topic0', 'topic1', 'topic2', 'topic3'].map((name) => ({
        name,
        description: `${name} hash.`,
      })),
      ...pagination,
    ],
  }),
  ...[
    ['price', 'ethprice', 'Get Ether last price', 'free'],
    ['supply', 'ethsupply', 'Get total Ether supply', 'free'],
    ['supply2', 'ethsupply2', 'Get total Ether supply 2', 'free'],
    ['chain-size', 'chainsize', 'Get chain size', 'free'],
    ['node-count', 'nodecount', 'Get total nodes count', 'free'],
    ['daily-price', 'ethdailyprice', 'Get Ether historical price', 'pro'],
    ['daily-fees', 'dailytxnfee', 'Get daily network transaction fee', 'pro'],
    [
      'daily-new-addresses',
      'dailynewaddress',
      'Get daily new address count',
      'pro',
    ],
    [
      'daily-utilization',
      'dailynetutilization',
      'Get daily network utilization',
      'pro',
    ],
    [
      'daily-hashrate',
      'dailyavghashrate',
      'Get daily average hash rate',
      'pro',
    ],
    ['daily-txs', 'dailytx', 'Get daily transaction count', 'pro'],
    [
      'daily-difficulty',
      'dailyavgnetdifficulty',
      'Get daily average difficulty',
      'pro',
    ],
  ].map(([command, action, title, gate]) =>
    endpoint({
      group: 'stats',
      command,
      title,
      description: title,
      module: 'stats',
      action,
      gate: gate as EndpointGate,
      docsSlug: action,
      params: gate === 'pro' || action === 'chainsize' ? dateRange : [],
    }),
  ),
  endpoint({
    group: 'transactions',
    command: 'status',
    title: 'Get transaction execution status',
    description: 'Checks transaction execution error status.',
    module: 'transaction',
    action: 'getstatus',
    docsSlug: 'getstatus',
    params: [txhash],
  }),
  endpoint({
    group: 'transactions',
    command: 'receipt-status',
    title: 'Get transaction receipt status',
    description: 'Checks transaction receipt success status.',
    module: 'transaction',
    action: 'gettxreceiptstatus',
    docsSlug: 'gettxreceiptstatus',
    params: [txhash],
  }),
  ...[
    ['balance', 'account', 'tokenbalance', 'Get ERC20 token balance', 'free'],
    [
      'historical-balance',
      'account',
      'tokenbalancehistory',
      'Get historical ERC20 balance',
      'pro',
    ],
    ['supply', 'stats', 'tokensupply', 'Get token total supply', 'free'],
    [
      'historical-supply',
      'stats',
      'tokensupplyhistory',
      'Get historical token supply',
      'pro',
    ],
    ['info', 'token', 'tokeninfo', 'Get token info', 'pro'],
    [
      'holder-count',
      'token',
      'tokenholdercount',
      'Get token holder count',
      'pro',
    ],
    ['holders', 'token', 'tokenholderlist', 'Get token holder list', 'pro'],
    ['top-holders', 'token', 'topholders', 'Get top token holders', 'pro'],
    [
      'address-erc20-holdings',
      'account',
      'addresstokenbalance',
      'Get address ERC20 holdings',
      'pro',
    ],
    [
      'address-erc721-holdings',
      'account',
      'addresstokennftbalance',
      'Get address ERC721 holdings',
      'pro',
    ],
    [
      'address-erc721-inventory',
      'account',
      'addresstokennftinventory',
      'Get address ERC721 inventory',
      'pro',
    ],
  ].map(([command, module, action, title, gate]) =>
    endpoint({
      group: 'tokens',
      command,
      title,
      description: title,
      module,
      action,
      gate: gate as EndpointGate,
      docsSlug: action,
      rateLimitRps: gate === 'pro' ? 2 : undefined,
      params: [
        contractaddress,
        { ...address, required: false },
        { name: 'blockno', description: 'Historical block number.' },
        ...pagination,
      ],
    }),
  ),
  ...[
    ['deposits', 'getdeposittxs', 'Get L2 deposit transactions'],
    ['withdrawals', 'getwithdrawaltxs', 'Get L2 withdrawal transactions'],
    ['bridge', 'txnbridge', 'Get bridge transactions'],
  ].map(([command, action, title]) =>
    endpoint({
      group: 'l2',
      command,
      title,
      description: title,
      module: 'account',
      action,
      docsSlug: action,
      params: [address, ...pagination],
    }),
  ),
  endpoint({
    group: 'nametags',
    command: 'get',
    title: 'Get nametag for address',
    description: 'Retrieves Etherscan nametag metadata for an address.',
    module: 'nametag',
    action: 'getaddresstag',
    gate: 'pro_plus',
    rateLimitRps: 2,
    docsSlug: 'getaddresstag',
    params: [address],
  }),
  endpoint({
    group: 'metadata',
    command: 'labels',
    title: 'Get label master list',
    description: 'Retrieves enterprise metadata label master list.',
    module: 'nametag',
    action: 'getlabelmasterlist',
    gate: 'enterprise',
    docsSlug: 'getlabelmasterlist',
    baseUrl: 'https://api-metadata.etherscan.io/v1/api.ashx',
    noChain: true,
  }),
  endpoint({
    group: 'metadata',
    command: 'export',
    title: 'Export address metadata',
    description: 'Starts enterprise address metadata CSV or ZIP export.',
    module: 'nametag',
    action: 'exportaddresstags',
    gate: 'enterprise',
    rateLimitRps: 2,
    docsSlug: 'exportaddresstags-v2',
    baseUrl: 'https://api-metadata.etherscan.io/v1/api.ashx',
    params: [
      { name: 'label', description: 'Label filter.', defaultValue: 'all' },
      {
        name: 'format',
        description: 'Export format.',
        defaultValue: 'csv',
        choices: ['csv', 'zip'],
      },
    ],
  }),
  endpoint({
    group: 'usage',
    command: 'limits',
    title: 'Get API usage limits',
    description: 'Retrieves current API usage and limits.',
    module: 'stats',
    action: 'getapilimit',
    docsSlug: 'getapilimit',
    noChain: true,
  }),
]

export function findEndpoint(group: EndpointGroup, command: string) {
  return endpoints.find(
    (endpointDefinition) =>
      endpointDefinition.group === group &&
      endpointDefinition.command === command,
  )
}
