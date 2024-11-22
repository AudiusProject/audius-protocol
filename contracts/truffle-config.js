/**
 * Audius Smart Contracts truffle configuration
 * @authors Hareesh Nagaraj, Sid Sethi, Roneil Rumburg
 * @version 0.0.1
 */

// Import babel for ES6 support
require('babel-register')({
  presets: [
    [
      'env',
      {
        targets: {
          node: '8.0'
        }
      }
    ]
  ]
})

require('babel-polyfill')
const HDWalletProvider = require('@truffle/hdwallet-provider')

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    production: {
      provider: () =>
        new HDWalletProvider(
          process.env.NETHERMIND_DEPLOYER_PRIVATE_KEY,
          liveNetwork
        ),
      network_id: '31524',
      gas: 0,
      gasPrice: 0,
      gasLimit: 0
    },
    staging: {
      provider: () =>
        new HDWalletProvider(
          process.env.NETHERMIND_DEPLOYER_PRIVATE_KEY,
          liveNetwork
        ),
      network_id: '1056801',
      gas: 0,
      gasPrice: 0,
      gasLimit: 0
    },
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 8546, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
      gas: 8000000, // 8,000,000 is a proxy for block gas limit even though it is now much higher
      // recommended as a ganache performance improvement https://github.com/trufflesuite/truffle/issues/3522
      disableConfirmationListener: true
    },
    test: {
      host: 'poa-ganache',
      port: 8545,
      network_id: '*',
      gas: 8000000,
      disableConfirmationListener: true
    },
    predeploy: {
      host: '127.0.0.1',
      port: 8546,
      network_id: '*', // Match any network id
      verify: {
        apiUrl: 'http://poa-blockscout:4000/api',
        apiKey: 'NONE',
        explorerUrl: 'http://poa-blockscout:4000/address'
      }
    },
    audius_private: {
      host: '127.0.0.1',
      port: 8000,
      network_id: 1353,
      gasPrice: 1000000000
    }
  },
  mocha: {
    enableTimeouts: false
  },
  plugins: ['truffle-plugin-verify']
}
