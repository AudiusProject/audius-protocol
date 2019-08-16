const convict = require('convict')
const fs = require('fs')

// Define a schema
const config = convict({
  dbUrl: {
    doc: 'Database URL connection string',
    format: String,
    env: 'dbUrl',
    default: null
  },
  ipfsHost: {
    doc: 'IPFS host address',
    format: String,
    env: 'ipfsHost',
    default: null
  },
  ipfsPort: {
    doc: 'IPFS port',
    format: 'port',
    env: 'ipfsPort',
    default: null
  },
  ipfsPeerAddresses: {
    doc: 'IPFS initial peer addresses',
    format: String,
    env: 'ipfsPeerAddresses',
    default: null
  },
  logLevel: {
    doc: 'Log level',
    format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
    env: 'logLevel',
    default: 'info'
  },
  port: {
    doc: 'Port to run service on',
    format: 'port',
    env: 'port',
    default: null
  },
  web3ProviderUrl: {
    doc: 'web3 provider url',
    format: String,
    env: 'web3ProviderUrl',
    default: null
  },

  // wallet information
  delegateOwnerWallet: {
    doc: 'wallet address',
    format: String,
    env: 'delegateOwnerWallet',
    default: null
  },
  delegatePrivateKey: {
    doc: 'private key string',
    format: String,
    env: 'delegatePrivateKey',
    default: null
  },

  // loaded through contract-config.json, if an env variable declared, env var takes precendence
  registryAddress: {
    doc: 'Registry address of contracts deployed on web3Provider',
    format: String,
    default: null,
    env: 'registryAddress'
  },

  ethProviderUrl: {
    doc: 'eth provider url',
    format: String,
    env: 'ethProviderUrl',
    default: null
  },
  ethNetworkId: {
    doc: 'eth network id',
    format: String,
    env: 'ethNetworkId',
    default: null
  },
  ethTokenAddress: {
    doc: 'eth token address',
    format: String,
    env: 'ethTokenAddress',
    default: null
  },
  ethRegistryAddress: {
    doc: 'eth registry address',
    format: String,
    env: 'ethRegistryAddress',
    default: null
  },
  ethOwnerWallet: {
    doc: 'eth owner wallet',
    format: String,
    env: 'ethOwnerWallet',
    default: null
  }
})

// initialize configuration

// if you wanted to load a file
// this is lower precendence than env variables, so if registryAddress or ownerWallet env
// variables are defined, they take precendence

// TODO(DM) - remove these defaults
const defaultConfigExists = fs.existsSync('default-config.json')
if (defaultConfigExists) config.loadFile('default-config.json')

// the contract-config.json file is used to load registry address locally
// during development
const contractConfigExists = fs.existsSync('contract-config.json')
if (contractConfigExists) config.loadFile('contract-config.json')

// the eth-contract-config.json file is used to load registry address locally
// during development
const ethContractConfigExists = fs.existsSync('eth-contract-config.json')
if (ethContractConfigExists) {
  let ethContractConfig = require('../eth-contract-config.json')
  
  config.load({
    'ethTokenAddress': ethContractConfig.audiusTokenAddress,
    'ethRegistryAddress': ethContractConfig.registryAddress,
    'ethOwnerWallet': ethContractConfig.ownerWallet
  })
}

// Perform validation and error any properties are not present on schema
config.validate()

console.log(config.getProperties())

module.exports = config
