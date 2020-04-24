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

// Values must be set in calling environment
// Consult @hareeshnagaraj for details
const privateKey = getEnv('ETH_WALLET_PRIVATE_KEY')
const liveNetwork = getEnv('ETH_LIVE_NETWORK')
const liveNetworkId = getEnv('ETH_LIVE_NETWORK_ID')

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
      network_id: '*' // Any network (default: none)
    },
    test_local: {
      host: '127.0.0.1',
      port: 8556,
      network_id: '*'
    }
  },
  compilers: {
    solc: {
      parser: 'solcjs', // Leverages solc-js purely for speedy parsing
      settings: {
        evmVersion: 'constantinople',
        optimizer: {
          enabled: true,
          // runs: 10 // defaults to 200 --> ideally we should increase as much as possible until we ,
          details: {
            orderLiterals: true,
            deduplicate: true,
            cse: true,
            constantOptimizer: true,
            yul: false // TODO try after solc upgrade
          }
        }
      }
    }
  },
  mocha: {
    enableTimeouts: false
  },
  plugins: ['solidity-coverage']
}
