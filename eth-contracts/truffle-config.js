// Import babel for ES6 support
require('babel-register')({
  presets: [
    ['env', {
      'targets': {
        'node': '8.0'
      }
    }]
  ]
})
require('babel-polyfill')
const HDWalletProvider = require('truffle-hdwallet-provider')
const web3 = require('web3')

const getEnv = env => {
  const value = process.env[env]
  if (typeof value === 'undefined') {
    console.error(`${env} has not been set.`)
  }
  return value
}
let ENABLE_OPTIMIZER = true
if (getEnv('ENABLE_OPTIMIZER') === 'false') ENABLE_OPTIMIZER = false

// Values must be set in calling environment
// Consult @hareeshnagaraj for details
const privateKey = getEnv('ETH_WALLET_PRIVATE_KEY')
const liveNetwork = getEnv('ETH_LIVE_NETWORK')
const liveNetworkId = getEnv('ETH_LIVE_NETWORK_ID')

const solc = {
  // 0.5.17 is latest 0.5.x version
  // cannot use 0.6.x due to openzeppelin dependency, which are only 0.5.x compatible
  version: '0.5.17',
  parser: 'solcjs', // Leverages solc-js purely for speedy parsing
  settings: {
    evmVersion: 'istanbul' // istanbul is latest stable, and default setting
  }
}

if (ENABLE_OPTIMIZER) {
  solc.settings.optimizer = {
    enabled: true,
    runs: 200, // 200 is default value
    details: {
      orderLiterals: true,
      deduplicate: true,
      cse: true,
      constantOptimizer: true,
      yul: false // disabled as Yul optimizer is still experimental in 0.5.x
    }
  }
}
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    production: {
      provider: () => new HDWalletProvider(privateKey, liveNetwork),
      network_id: liveNetworkId,
      gasPrice: web3.utils.toWei('10', 'gwei')
    },
    staging: {
      provider: () => new HDWalletProvider(privateKey, liveNetwork),
      network_id: liveNetworkId,
      gasPrice: web3.utils.toWei('20', 'gwei')
    },
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 8546, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
      gas: 8000000 // 8,000,000 is a proxy for block gas limit even though it is now much higher
    },
    test_local: {
      host: '127.0.0.1',
      port: 8556,
      network_id: '*',
      gas: 8000000 // 8,000,000 is a proxy for block gas limit even though it is now much higher
    }
  },
  // https://solidity.readthedocs.io/en/develop/using-the-compiler.html#input-description
  compilers: {
    solc: solc
  },
  mocha: {
    enableTimeouts: false
  },
  plugins: ['solidity-coverage']
}
