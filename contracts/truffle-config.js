/**
 * Audius Smart Contracts truffle configuration
 * @authors Hareesh Nagaraj, Sid Sethi, Roneil Rumburg
 * @version 0.0.1
 */

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
const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*' // Match any network id
    },
    test_local: {
      host: '127.0.0.1',
      port: 8555,
      network_id: '*' // Match any network id
    },
    audius_private: {
      host: '127.0.0.1',
      port: 8000,
      network_id: 1353,
      gasPrice: 1000000000
    },
    poa_mainnet: {
      host: 'localhost',
      port: 8545,
      network_id: '99',
      gas: 8000000,
      gasPrice: 1000000000,
      skipDryRun: true
    },
    poa_sokol: {
      provider: function () {
        return new HDWalletProvider(
          [
            // Private keys in array format here
          ],
          "https://sokol.poa.network",
          0,
          2
        )
      },
      network_id: '77',
      gas: 8000000,
      gasPrice: 1000000000,
      skipDryRun: true
    },
  },
  mocha: {
    enableTimeouts: false
  }
}
