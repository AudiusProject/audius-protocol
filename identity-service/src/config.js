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
  redisHost: {
    doc: 'Redis host name',
    format: String,
    env: 'redisHost',
    default: null
  },
  redisPort: {
    doc: 'Redis port',
    format: 'port',
    env: 'redisPort',
    default: null
  },
  web3Provider: {
    doc: 'web3 provider url',
    format: String,
    env: 'web3Provider',
    default: null
  },
  port: {
    doc: 'Port to run service on',
    format: 'port',
    env: 'port',
    default: null
  },
  logLevel: {
    doc: 'Log level',
    format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
    env: 'logLevel',
    default: 'info'
  },
  twitterAPIKey: {
    doc: 'Twitter API key',
    format: String,
    env: 'twitterAPIKey',
    default: null
  },
  twitterAPISecret: {
    doc: 'Twitter API Secret',
    format: String,
    env: 'twitterAPISecret',
    default: null
  },
  instagramAPIKey: {
    doc: 'Instagram API Key',
    format: String,
    env: 'instagramAPIKey',
    default: null
  },
  instagramAPISecret: {
    doc: 'Instagram API Secret',
    format: String,
    env: 'instagramAPISecret',
    default: null
  },
  relayerPrivateKey: {
    doc: 'Relayer(used to make relay transactions) private key',
    format: String,
    env: 'relayerPrivateKey',
    default: null,
    sensitive: true
  },
  relayerPublicKey: {
    doc: 'Relayer(used to make relay transactions) public key',
    format: String,
    env: 'relayerPublicKey',
    default: null
  },
  userVerifierPrivateKey: {
    doc: 'User verifier(used to write users to chain as isVerified) private key',
    format: String,
    env: 'userVerifierPrivateKey',
    default: null,
    sensitive: true
  },
  userVerifierPublicKey: {
    doc: 'User verifier(used to write users to chain as isVerified) public key',
    format: String,
    env: 'userVerifierPublicKey',
    default: null
  },
  blacklisterPrivateKey: {
    doc: 'Blacklister(used to write multihashes as blacklisted on chain) private key',
    format: String,
    env: 'blacklisterPrivateKey',
    default: null,
    sensitive: true
  },
  blacklisterPublicKey: {
    doc: 'Blacklister(used to write multihashes as blacklisted on chain) public key',
    format: String,
    env: 'blacklisterPublicKey',
    default: null
  },
  rateLimitingReqLimit: {
    doc: 'Total request per hour rate limit',
    format: 'nat',
    env: 'rateLimitingReqLimit',
    default: null
  },
  rateLimitingAuthLimit: {
    doc: 'Auth requests per hour rate limit',
    format: 'nat',
    env: 'rateLimitingAuthLimit',
    default: null
  },
  rateLimitingTwitterLimit: {
    doc: 'Twitter requests per hour rate limit',
    format: 'nat',
    env: 'rateLimitingTwitterLimit',
    default: null
  },
  minimumBalance: {
    doc: 'Minimum token balance below which /balance_check fails',
    format: Number,
    env: 'minimumBalance',
    default: null
  },

  // loaded through contract-config.json, if an env variable declared, env var takes precendence
  registryAddress: {
    doc: 'Registry address of contracts deployed on web3Provider',
    format: String,
    default: null,
    env: 'registryAddress'
  }
})

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

// Perform validation and error any properties are not present on schema
config.validate()

module.exports = config
