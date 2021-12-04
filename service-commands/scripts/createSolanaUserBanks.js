const {
  createUserBankFrom
} = require('@audius/libs/src/services/solanaWeb3Manager/userBank')
const SolanaUtils = require('@audius/libs/src/services/solanaWeb3Manager/utils')
const IdentityService = require('@audius/libs/src/services/identity')
const axios = require('axios')
const solanaWeb3 = require('@solana/web3.js')
const { PublicKey, Keypair } = solanaWeb3
const config = require('../config/config')
const untildify = require('untildify')
const { program } = require('commander')

/**
 * @typedef {Object} SolanaConfig
 * @property {string} SOLANA_ENDPOINT
 * @property {string} SOLANA_MINT_ADDRESS
 * @property {string} SOLANA_TOKEN_ADDRESS
 * @property {string} SOLANA_CLAIMABLE_TOKEN_PROGRAM_ADDRESS
 * @property {string} SOLANA_REWARDS_MANAGER_PROGRAM_ID
 * @property {string} SOLANA_REWARDS_MANAGER_PROGRAM_PDA
 * @property {string} SOLANA_REWARDS_MANAGER_TOKEN_PDA
 * @property {string} SOLANA_FEE_PAYER_SECRET_KEY
 */

/**
 * @typedef {Object} ServiceConfig
 * @property {string} url
 */

/**
 * @typedef {Object} Config
 * @property {SolanaConfig} solanaConfig
 * @property {ServiceConfig} identityServiceConfig
 * @property {ServiceConfig} discoveryProviderConfig
 */

/**
 * Gets a batch of users from the /users endpoint to get their wallets
 * Preferred over depending on libs since we want to specify a DN manually
 * @param {string} discoveryProviderUrl the url to the selected discovery provider
 * @param {number} batchNumber the current batch number (0 for first)
 * @param {number} batchSize the number of users to fetch
 */
async function getUserBatch(discoveryProviderUrl, batchNumber, batchSize) {
  const response = await axios({
    method: 'get',
    baseURL: discoveryProviderUrl,
    url: '/users',

    params: {
      offset: batchNumber * batchSize,
      limit: batchSize
    }
  })
  return response.data.data
}

/**
 * Sets up the solana public keys and necessary services using the specified config
 * @param {Config} config the configuration to use for setup
 * @returns {Object} the instantiated keys and services
 */
async function setupConfig(config) {
  const {
    solanaConfig,
    identityServiceConfig,
    discoveryProviderConfig
  } = config
  // Helper to safely create pubkey from nullable val
  const newPublicKeyNullable = val => (val ? new PublicKey(val) : null)

  const claimableTokenProgramKey = newPublicKeyNullable(
    solanaConfig.SOLANA_CLAIMABLE_TOKEN_PROGRAM_ADDRESS
  )
  const mintKey = newPublicKeyNullable(solanaConfig.SOLANA_MINT_ADDRESS)
  const claimableTokenPDAKey = newPublicKeyNullable(
    solanaConfig.SOLANA_CLAIMABLE_TOKEN_PDA ||
      (claimableTokenProgramKey
        ? (
            await SolanaUtils.findProgramAddressFromPubkey(
              claimableTokenProgramKey,
              mintKey
            )
          )[0].toString()
        : null)
  )
  const feePayerKey = newPublicKeyNullable(
    solanaConfig.SOLANA_FEE_PAYER_ADDRESS ||
      Keypair.fromSecretKey(solanaConfig.SOLANA_FEE_PAYER_SECRET_KEY).publicKey
  )
  const solanaTokenProgramKey = newPublicKeyNullable(
    solanaConfig.SOLANA_TOKEN_ADDRESS
  )
  const connection = new solanaWeb3.Connection(solanaConfig.SOLANA_ENDPOINT)
  const identityService = new IdentityService(identityServiceConfig.url)
  const result = {
    claimableTokenPDAKey,
    feePayerKey,
    mintKey,
    solanaTokenProgramKey,
    claimableTokenProgramKey,
    identityService,
    connection,
    discoveryProviderUrl: discoveryProviderConfig.url
  }
  Object.keys(result).forEach(key => {
    if (result[key] === null) {
      throw Error(`Failed to init '${key}'`)
    }
  })
  return result
}

/**
 * Gets the config for the specified environment
 * @param {'dev'|'stage'|'prod'} env the environment
 * @returns {Config} config
 */
function getConfigForEnv(env) {
  // TODO: Prod/Stage config
  if (env !== 'dev') {
    throw Error(`Environment ${env} not implemented`)
  }
  const configDir = untildify(config.get('audius_config_dir'))
  const solanaConfig = require(`${configDir}/solana-program-config.json`)
  return {
    solanaConfig: {
      SOLANA_ENDPOINT: solanaConfig.endpoint,
      SOLANA_MINT_ADDRESS: solanaConfig.splToken,
      SOLANA_TOKEN_ADDRESS: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      SOLANA_CLAIMABLE_TOKEN_PROGRAM_ADDRESS:
        solanaConfig.claimableTokenAddress,
      SOLANA_REWARDS_MANAGER_PROGRAM_ID: solanaConfig.rewardsManagerAddress,
      SOLANA_REWARDS_MANAGER_PROGRAM_PDA: solanaConfig.rewardsManagerAccount,
      SOLANA_REWARDS_MANAGER_TOKEN_PDA: solanaConfig.rewardsManagerTokenAccount,
      SOLANA_FEE_PAYER_ADDRESS: solanaConfig.feePayerWallet.ethAddress,
      SOLANA_FEE_PAYER_SECRET_KEY: Uint8Array.from(solanaConfig.feePayerWallet)
    },
    identityServiceConfig: { url: config.get('identity_service') },
    discoveryProviderConfig: {
      // Manually set DN instead of using auto selection
      url: 'http://dn1_web-server_1:5000'
    }
  }
}

/**
 * Main method
 * @param {Object} options
 */
async function main(options) {
  const config = getConfigForEnv(options.env)
  const { discoveryProviderUrl, ...createUserBankParams } = await setupConfig(
    config
  )

  let batchNumber = 0
  let users = await getUserBatch(
    discoveryProviderUrl,
    batchNumber,
    options.batchSize
  )
  while (users.length > 0) {
    const batchPromises = users.map(async user => {
      console.debug(
        `[START]: Creating user bank for user_id=${user.user_id} wallet=${user.wallet}`
      )
      return createUserBankFrom({
        ...createUserBankParams,
        ethAddress: user.wallet
      })
        .then(() => {
          console.debug(
            `[SUCCESS]: Successfully created user bank for user_id=${user.user_id} wallet=${user.wallet}`
          )
        })
        .catch(e => {
          console.error(e)
          console.error(
            `[FAILED]: Failed to create user bank for user_id=${user.user_id} wallet=${user.wallet} error=${e}`
          )
        })
    })
    await Promise.all(batchPromises)
    console.log(`Done with batch ${batchNumber++}`)
    users = await getUserBatch(
      discoveryProviderUrl,
      batchNumber,
      options.batchSize
    )
  }
}
program
  .option(
    '-e, --env <environment>',
    'which env to use (eg. "dev", "stage", "prod")',
    'dev'
  )
  .option('-b, --batch-size <size>', 'how many users to process per batch', 50)
main(program.opts())
