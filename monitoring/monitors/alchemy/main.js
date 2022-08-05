const { createAlchemyWeb3 } = require('@alch/alchemy-web3')
const express = require('express')
const promClient = require('prom-client')

require('console-stamp')(console, '[HH:MM:ss.l]')

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
    buckets: [1, 10, 100, 1000, 10000, 100000],
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
AUDIUS_CONTRACT = '0x18aAA7115705e8be94bfFEBDE57Af9BFc265B998'
AUDIUS_DECIMALS = 18

const scanWallets = async () => {
  // Wallet addresses to monitor all transactions for
  const addresses = {
    communityTreasury: {
      address: '0x4deca517d6817b6510798b7328f2314d3003abac',
      tokens: [],
    },
    multiSig: {
      address: '0xeABCcd75dA6c021c7553dB4A74CACC958812432A',
      tokens: [],
    },
    tokenContract: {
      address: AUDIUS_CONTRACT,
      tokens: [],
    },
  }

  for (const addressName in addresses) {
    const address = addresses[addressName].address

    // Get token balances
    const balances = await web3.alchemy.getTokenBalances(address)

    // Remove tokens with zero balance
    const nonZeroBalances = balances.tokenBalances.filter(token => {
      return token.tokenBalance !== '0'
    })

    // Counter for SNo of final output
    const i = 1

    // Minimize variable churn
    let name
    let symbol
    let decimals

    // Loop through all tokens with non-zero balance
    for (token of nonZeroBalances) {
      // Get balance of token
      let balance = token.tokenBalance

      if (token.contractAddress == AUDIUS_CONTRACT) {
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
      tokenSummary = {
        name,
        balance,
        symbol,
      }
      addresses[addressName].tokens.push(tokenSummary)

      // export metric for Prometheus
      METRICS[metricNames.BALANCE].set(
        { address_name: addressName },
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
      console.log(data)

      balance = parseInt(data.data, 16)
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
