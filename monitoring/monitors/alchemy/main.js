const { createAlchemyWeb3 } = require('@alch/alchemy-web3')
const express = require('express')
const promClient = require('prom-client')

// Setup Alchemy client
const web3 = createAlchemyWeb3(
  process.env.WEBSOCKETS,
)

// Setup additional Alchemy client (used for testing and possible future features)
// const { Network, Alchemy } = require("alchemy-sdk");
// const settings = {
//     apiKey: process.env.API_KEY,
//     network: Network.ETH_MAINNET,
// };
// const alchemy = new Alchemy(settings);

// Setup Prometheus metrics
const prefix = 'audius_monitors_alchemy_'
const metricNames = {
  BALANCE: 'balance',
  TOKEN_TRANSFER: 'token_transfer',
  API_FAILURE: 'api_failure',
}
const METRICS = Object.freeze({
  [metricNames.BALANCE]: new promClient.Gauge({
    name: `${prefix}${metricNames.BALANCE}`,
    help: 'Balance of a wallet holding AUDIO',
    labelNames: ['address_name'],
  }),
  [metricNames.TOKEN_TRANSFER]: new promClient.Histogram({
    name: `${prefix}${metricNames.TOKEN_TRANSFER}`,
    help: 'Token transfers',
    buckets: [100000, 1000000, 10000000, 100000000, 1000000000, 10000000000],
  }),
  [metricNames.API_FAILURE]: new promClient.Gauge({
    name: `${prefix}${metricNames.API_FAILURE}`,
    help: 'Count when alchemy calls fail.',
  }),
})
METRICS[metricNames.API_FAILURE].set(0)
const enableDefaultMetrics = () => {
  const collectDefaultMetrics = promClient.collectDefaultMetrics
  collectDefaultMetrics({ prefix })
}
enableDefaultMetrics()

// Constants
const AUDIUS_CONTRACT = '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998'
const AUDIUS_DECIMALS = 18

const scanWallets = async () => {
  // Wallet addresses to monitor all transactions for
  const addresses = {
    registry: {
      name: 'Registry',
      address: '0xd976d3b4f4e22a238c1A736b6612D22f17b6f64C',
      tokens: [],
    },
    token: {
      name: 'Token',
      address: AUDIUS_CONTRACT,
      tokens: [],
    },
    governance: {
      name: 'Governance',
      address: '0x4DEcA517D6817B6510798b7328F2314d3003AbAC',
      tokens: [],
    },
    staking: {
      name: 'Staking',
      address: '0xe6D97B2099F142513be7A2a068bE040656Ae4591',
      tokens: [],
    },
    delegateManager: {
      name: 'DelegateManager',
      address: '0x4d7968ebfD390D5E7926Cb3587C39eFf2F9FB225',
      tokens: [],
    },
    claimsManager: {
      name: 'ClaimsManager',
      address: '0x44617F9dCEd9787C3B06a05B35B4C779a2AA1334',
      tokens: [],
    },
    serviceTypeManager: {
      name: 'ServiceTypeManager',
      address: '0x9EfB0f4F38aFbb4b0984D00C126E97E21b8417C5',
      tokens: [],
    },
    serviceProviderFactory: {
      name: 'ServiceProviderFactory',
      address: '0xD17A9bc90c582249e211a4f4b16721e7f65156c8',
      tokens: [],
    },
    ethRewardsManager: {
      name: 'EthRewardsManager',
      address: '0x5aa6B99A2B461bA8E97207740f0A689C5C39C3b0',
      tokens: [],
    },
    wormholeClient: {
      name: 'WormholeClient',
      address: '0x6E7a1F7339bbB62b23D44797b63e4258d283E095',
      tokens: [],
    },
    trustedNotifierManager: {
      name: 'TrustedNotifierManager',
      address: '0x6f08105c8CEef2BC5653640fcdbBE1e7bb519D39',
      tokens: [],
    },
    // ClaimableTokens: {
    //   address: 'Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ',
    //   tokens: [],
    // },
    // RewardsManager: {
    //   address: 'DDZDcYdQFEMwcu2Mwo75yGFjJ1mUQyyXLWzhZLEVFcei',
    //   tokens: [],
    // },
    multiSig: {
      name: 'MultiSig',
      address: '0xeABCcd75dA6c021c7553dB4A74CACC958812432A',
      tokens: [],
    },
  }

  for (const key in addresses) {
    const address = addresses[key].address

    // Get token balances
    const balances = await web3.alchemy.getTokenBalances(address)

    // Remove tokens with zero balance
    const nonZeroBalances = balances.tokenBalances.filter(token => {
      return token.tokenBalance !== '0'
    })

    // Minimize variable churn
    let name
    let symbol
    let decimals

    // Loop through all tokens with non-zero balance
    for (const token of nonZeroBalances) {
      // Get balance of token
      let balance = token.tokenBalance

      if (token.contractAddress === AUDIUS_CONTRACT) {
        // Skip API call for common request
        name = 'Audius'
        decimals = AUDIUS_DECIMALS
        symbol = 'AUDIO'
      } else {
        // Get metadata of non-AUDIO token
        const metadata = await web3.alchemy.getTokenMetadata(token.contractAddress)
        name = metadata.name
        decimals = metadata.decimals
        symbol = metadata.symbol
      }

      // Compute token balance in human-readable format
      balance = balance / Math.pow(10, decimals)
      balance = balance.toFixed(2)

      // Collection for logs
      const tokenSummary = {
        name,
        balance,
        symbol,
      }
      addresses[key].tokens.push(tokenSummary)

      // export metric for Prometheus
      METRICS[metricNames.BALANCE].set(
        { address_name: addresses[key].name },
        parseFloat(balance),
      )
    }
  }

  console.log(JSON.stringify(addresses))
}
const monitorWallets = async () => {
  try {
    await scanWallets()
  } catch (error) {
    console.log(error)
    METRICS[metricNames.API_FAILURE].inc()
  }
}

const monitorTransfers = async () => {
  web3.eth.subscribe('logs', {
    address: AUDIUS_CONTRACT,
    topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
  }).on('data', (data) => {
    try {
      let balance = parseInt(data.data, 16)
      balance = balance / Math.pow(10, AUDIUS_DECIMALS)
      balance = balance.toFixed(2)
      console.log(balance)
      METRICS[metricNames.TOKEN_TRANSFER].observe(parseFloat(balance))
    } catch (error) {
      console.log(error)
      METRICS[metricNames.API_FAILURE].inc()
    }
  })
}

const main = () => {
  monitorWallets()
  setInterval(function () { monitorWallets() }, 30 * 1000)
  monitorTransfers()

  // Start Prometheus exporter
  const server = express()
  const port = process.env.PORT || 3000
  server.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', promClient.register.contentType)
      res.end(await promClient.register.metrics())
    } catch (ex) {
      res.status(500).end(ex)
    }
  })
  server.listen(port, () => {
    console.log(
            `Server listening to ${port}, metrics exposed on /metrics endpoint`,
    )
  })
}

main()
