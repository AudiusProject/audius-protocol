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
const fs = require('fs')
const LineByLineReader = require('line-by-line')
const qs = require('qs')

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
 * @return {Object[]} the users
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
 * Gets a batch of users from the /users endpoint to get their wallets
 * Preferred over depending on libs since we want to specify a DN manually
 * @param {string} discoveryProviderUrl the url to the selected discovery provider
 * @param {string[]} ids the ids of the users to fetch
 * @return {Object[]} the users
 */
async function getUserBatchFromIds(discoveryProviderUrl, ids) {
  const response = await axios({
    method: 'get',
    baseURL: discoveryProviderUrl,
    url: '/users',
    params: {
      id: ids
    },
    paramsSerializer: params => {
      return qs.stringify(params, { arrayFormat: 'repeat' })
    }
  })
  return response.data.data
}

/**
 * Sets up the solana public keys and necessary services using the specified config
 * @param {Config} config the configuration to use for setup
 * @returns {Promise<Object>} the instantiated keys and services
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
  // Setup config and init variables
  const config = getConfigForEnv(options.env)
  const { discoveryProviderUrl, ...createUserBankParams } = await setupConfig(
    config
  )
  let batchNumber = 0
  if (options.input === options.output) {
    throw new Error('Input and output files should not be the same')
  }
  if (options.output && fs.existsSync(options.output)) {
    console.log(`Output file ${options.output} already exists, overwriting...`)
    fs.writeFileSync(options.output, '')
  }
  if (options.input && !fs.existsSync(options.input)) {
    throw new Error('Input file does not exist')
  }

  /**
   * Hits Discovery to scan through all users and process batch by batch
   */
  const processAll = async () => {
    let users = await getUserBatch(
      discoveryProviderUrl,
      batchNumber,
      options.batchSize
    )
    while (users.length > 0) {
      await processUserBatch(users, createUserBankParams, options.output)
      console.log(`[BATCH] Done with batch ${batchNumber++}`)
      users = await getUserBatch(
        discoveryProviderUrl,
        batchNumber,
        options.batchSize
      )
    }
    console.log('[FINISH] Finished processing all users')
  }

  /**
   * Only process the IDs from an input file, still batch by batch
   */
  const processInputFile = () => {
    const lineReader = new LineByLineReader(options.input)
    let idBatch = []
    lineReader.on('line', async line => {
      idBatch.push(line)
      if (idBatch.length >= options.batchSize) {
        lineReader.pause()
        const users = await getUserBatchFromIds(discoveryProviderUrl, idBatch)
        // Check for missing IDs
        const userIds = users.map(u => u.user_id.toString())
        idBatch
          .filter(id => !userIds.includes(id))
          .forEach(id => {
            console.error(`[ERROR] User user_id=${id} not found`)
            if (options.output) {
              fs.appendFileSync(options.output, id + '\n')
            }
          })
        await processUserBatch(users, createUserBankParams, options.output)
        idBatch = []
        batchNumber++
        console.log(`[BATCH] Done with batch ${batchNumber++}`)
        lineReader.resume()
      }
    })
    lineReader.on('error', console.error)
    lineReader.on('end', () => {
      // Process last batch
      getUserBatchFromIds(discoveryProviderUrl, idBatch)
        .then(users =>
          processUserBatch(users, createUserBankParams, options.output)
        )
        .then(() => {
          batchNumber++
          console.log(`[BATCH] Done with batch ${batchNumber++}`)
          console.log(`[FINISH] Finished processing ${options.input}`)
        })
    })
  }

  /**
   * Processes a batch of users, creating user banks for them all
   * @param {Object[]} users the list of users to process
   */
  const processUserBatch = users => {
    const batchPromises = users.map(async user => {
      console.debug(
        `[REQUEST]: Creating user bank for user_id=${user.user_id} wallet=${user.wallet}`
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
          console.error(
            `[FAILED]: Failed to create user bank for user_id=${user.user_id} wallet=${user.wallet} error=${e}`
          )
          if (options.output) {
            fs.appendFileSync(options.output, user.user_id + '\n')
          }
        })
    })
    return Promise.all(batchPromises)
  }
  if (options.input) {
    console.log(`[START] Processing file '${options.input}'`)
    processInputFile()
  } else {
    console.log(`[START] Processing all users from ${discoveryProviderUrl}`)
    await processAll()
  }
}

program
  .option(
    '-e, --env <environment>',
    'which env to use (eg. "dev", "stage", "prod")',
    'dev'
  )
  .option('-b, --batch-size <size>', 'how many users to process per batch', 50)
  .option(
    '-o, --output <filename>',
    'the filename which the userIds of failed requests will be written, separated by new lines',
    'failedIds.txt'
  )
  .option(
    '-i, --input <filename>',
    'the filename from which to load the list of userIds to generate user banks, separated by new lines'
  )

program.parse(process.argv)
main(program.opts())
