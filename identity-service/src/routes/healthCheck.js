const config = require('../config.js')
const models = require('../models')
const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { sequelize } = require('../models')
const { getRelayerFunds } = require('../txRelay')
const Web3 = require('web3')

const axios = require('axios')

let notifDiscProv = config.get('notificationDiscoveryProvider')

// Defaults used in relay health check endpoint
const RELAY_HEALTH_TEN_MINS_AGO_BLOCKS = 120 // 1 block/5sec = 120 blocks/10 minutes
const RELAY_HEALTH_MAX_TRANSACTIONS = 100 // max transactions to look into
const RELAY_HEALTH_MAX_ERRORS = 5 // max acceptable errors for a 200 response
const RELAY_HEALTH_MIN_NUM_USERS = 3 // min number of users affected to qualify for error
const RELAY_HEALTH_MAX_BLOCK_RANGE = 360 // max block range allowed from query params
// if (txs on blockchain / attempted) is less than this percent, health check will error
// eg. 10 transactions on chain but 120 attempts should error
const RELAY_HEALTH_SENT_VS_ATTEMPTED_THRESHOLD = 0.75
const RELAY_HEALTH_ACCOUNT = config.get('relayerPublicKey')

// flatten one level of nexted arrays
const flatten = (arr) => arr.reduce((acc, val) => acc.concat(val), [])

module.exports = function (app) {
  /**
   * Relay health check endpoint. Takes the query params startBlock, endBlock, maxTransactions, and maxErrors.
   * If those query params are not specified, use default values.
   */
  /*
  There are a few scenarios where a health check should return unhealthy
  1. Some number of relays are failing for some number of users
     To solve this, traverse the blocks for Audius transactions and count failures
     for users. If it's greater than some threshold, return error
  2. Relays are not being sent / sent but not acknowledged by blockchain
  */
  app.get('/health_check/relay', handleResponse(async (req, res) => {
    const start = Date.now()
    const audiusLibsInstance = req.app.get('audiusLibs')
    const redis = req.app.get('redis')
    const web3 = audiusLibsInstance.web3Manager.getWeb3()

    let endBlockNumber = parseInt((await web3.eth.getBlockNumber()), 10)
    let blockDiff = parseInt(req.query.blockDiff, 10) || RELAY_HEALTH_TEN_MINS_AGO_BLOCKS
    let maxTransactions = parseInt(req.query.maxTransactions, 10) || RELAY_HEALTH_MAX_TRANSACTIONS
    let maxErrors = parseInt(req.query.maxErrors, 10) || RELAY_HEALTH_MAX_ERRORS
    let sentVsAttemptThreshold = parseFloat(req.query.sentVsAttemptThreshold) || RELAY_HEALTH_SENT_VS_ATTEMPTED_THRESHOLD
    let isVerbose = req.query.verbose || false

    // In the case that endBlockNumber - blockDiff goes negative, default startBlockNumber to 0
    let startBlockNumber = Math.max(endBlockNumber - blockDiff, 0)

    // If query params are invalid, throw server error
    if (
      isNaN(startBlockNumber) ||
      isNaN(endBlockNumber) ||
      startBlockNumber < 0 ||
      endBlockNumber < 0 ||
      endBlockNumber < startBlockNumber
    ) {
      return errorResponseServerError(`Invalid start and/or end block. startBlock: ${startBlockNumber}, endBlock: ${endBlockNumber}`)
    }

    if (endBlockNumber - startBlockNumber > RELAY_HEALTH_MAX_BLOCK_RANGE) {
      return errorResponseServerError(`Block difference is over ${RELAY_HEALTH_MAX_BLOCK_RANGE}. startBlock: ${startBlockNumber}, endBlock: ${endBlockNumber}`)
    }

    if (
      isNaN(maxTransactions) ||
      isNaN(maxErrors) ||
      maxTransactions < 0 ||
      maxErrors < 0
    ) {
      return errorResponseServerError(`Invalid number of transactions and/or errors. maxTransactions: ${maxTransactions}, maxErrors: ${maxErrors}`)
    }

    let failureTxs = {} // senderAddress: [<txHash>]
    let txCounter = 0
    let minBlockTime = null

    req.logger.info(
      `Searching for transactions to/from account ${RELAY_HEALTH_ACCOUNT} within blocks ${startBlockNumber} and ${endBlockNumber}`
    )

    // Iterate through the range of blocks, looking into the max number of transactions that are from audius
    for (let i = endBlockNumber; i > startBlockNumber; i--) {
      // If the max number of transactions have been evaluated, break out
      if (txCounter > maxTransactions) break
      let block = await web3.eth.getBlock(i, true)
      if (!minBlockTime || block.timestamp < minBlockTime) minBlockTime = block.timestamp
      if (block && block.transactions.length) {
        for (const tx of block.transactions) {
          // If transaction is from audius account, determine success or fail status
          if (RELAY_HEALTH_ACCOUNT === tx.from) {
            const txHash = tx.hash
            const resp = await web3.eth.getTransactionReceipt(txHash)
            txCounter++

            // tx failed
            if (!resp.status) {
              const senderAddress = await redis.hget('txHashToSenderAddress', txHash)
              if (senderAddress) {
                if (!failureTxs[senderAddress]) failureTxs[senderAddress] = [txHash]
                else failureTxs[senderAddress].push(txHash)
              } else failureTxs['unknown'].push(txHash)
            }
          }
        }
      }
    }

    let isError = false
    if (Object.keys(failureTxs).length >= RELAY_HEALTH_MIN_NUM_USERS &&
      flatten(Object.values(failureTxs)).length > maxErrors) isError = true

    // delete old entries from set in redis
    const epochOneHourAgo = Math.floor(Date.now() / 1000) - 3600
    await redis.zremrangebyscore('relayTxAttempts', '-inf', epochOneHourAgo)
    await redis.zremrangebyscore('relayTxFailures', '-inf', epochOneHourAgo)
    await redis.zremrangebyscore('relayTxSuccesses', '-inf', epochOneHourAgo)

    // check if there have been any attempts in the time window that we processed the block health check
    const attemptedTxsInRedis = await redis.zrangebyscore('relayTxAttempts', minBlockTime, '+inf')
    const successfulTxsInRedis = await redis.zrangebyscore('relayTxSuccesses', minBlockTime, '+inf')
    const failureTxsInRedis = await redis.zrangebyscore('relayTxFailures', minBlockTime, '+inf')
    if ((txCounter / attemptedTxsInRedis.length) < sentVsAttemptThreshold) isError = true

    const serverResponse = {
      blockchain: {
        numberOfTransactions: txCounter,
        numberOfFailedTransactions: flatten(Object.values(failureTxs)).length,
        failedTransactionHashes: failureTxs,
        startBlock: startBlockNumber,
        endBlock: endBlockNumber
      },
      redis: {
        attemptedTxsCount: attemptedTxsInRedis.length,
        successfulTxsCount: successfulTxsInRedis.length,
        failureTxsCount: failureTxsInRedis.length
      },
      healthCheckComputeTime: Date.now() - start
    }

    if (isVerbose) {
      serverResponse.redis = {
        ...serverResponse.redis,
        attemptedTxsInRedis,
        successfulTxsInRedis,
        failureTxsInRedis
      }
    }

    if (isError) return errorResponseServerError(serverResponse)
    else return successResponse(serverResponse)
  }))

  app.get('/health_check', handleResponse(async (req, res) => {
    // for now we just check db connectivity
    await sequelize.query('SELECT 1', { type: sequelize.QueryTypes.SELECT })
    return successResponse({ 'healthy': true, 'git': process.env.GIT_SHA })
  }))

  app.get('/balance_check', handleResponse(async (req, res) => {
    let balance = parseFloat(Web3.utils.fromWei(await getRelayerFunds(), 'ether'))
    let minimumBalance = parseFloat(config.get('minimumBalance'))
    if (balance >= minimumBalance) {
      return successResponse({
        'above_balance_minimum': true,
        'minimum_balance': minimumBalance,
        'available_balance': balance
      })
    } else {
      return errorResponseServerError({
        'above_balance_minimum': false,
        'minimum_balance': minimumBalance,
        'available_balance': balance
      })
    }
  }))

  app.get('/notification_check', handleResponse(async (req, res) => {
    let highestBlockNumber = await models.NotificationAction.max('blocknumber')
    if (!highestBlockNumber) {
      highestBlockNumber = config.get('notificationStartBlock')
    }
    let redis = req.app.get('redis')
    let maxFromRedis = await redis.get('maxBlockNumber')
    if (maxFromRedis) {
      highestBlockNumber = parseInt(maxFromRedis)
    }
    let discProvHealthCheck = (await axios({
      method: 'get',
      url: `${notifDiscProv}/health_check`
    })).data
    let discProvDbHighestBlock = discProvHealthCheck['db']['number']
    let notifBlockDiff = discProvDbHighestBlock - highestBlockNumber
    let resp = {
      'discProv': discProvHealthCheck,
      'identity': highestBlockNumber,
      'notifBlockDiff': notifBlockDiff
    }
    if (notifBlockDiff > 100) {
      return errorResponseServerError(resp)
    }
    return successResponse(resp)
  }))

  /**
   * Exposes current and max db connection stats.
   * Returns error if db connection threshold exceeded, else success.
   */
  app.get('/db_check', handleResponse(async (req, res) => {
    const verbose = (req.query.verbose === 'true')
    const maxConnections = config.get('pgConnectionPoolMax')

    let numConnections = 0
    let connectionInfo = null
    let activeConnections = null
    let idleConnections = null

    // Get number of open DB connections
    const numConnectionsQuery = await sequelize.query("SELECT numbackends from pg_stat_database where datname = 'audius_identity_service'")
    if (numConnectionsQuery && numConnectionsQuery[0] && numConnectionsQuery[0][0] && numConnectionsQuery[0][0].numbackends) {
      numConnections = numConnectionsQuery[0][0].numbackends
    }

    // Get detailed connection info
    const connectionInfoQuery = (await sequelize.query("select wait_event_type, wait_event, state, query from pg_stat_activity where datname = 'audius_identity_service'"))
    if (connectionInfoQuery && connectionInfoQuery[0]) {
      connectionInfo = connectionInfoQuery[0]
      activeConnections = (connectionInfo.filter(conn => conn.state === 'active')).length
      idleConnections = (connectionInfo.filter(conn => conn.state === 'idle')).length
    }

    const resp = {
      'git': process.env.GIT_SHA,
      connectionStatus: {
        total: numConnections,
        active: activeConnections,
        idle: idleConnections
      },
      maxConnections
    }

    if (verbose) { resp.connectionInfo = connectionInfo }

    return (numConnections >= maxConnections) ? errorResponseServerError(resp) : successResponse(resp)
  }))
}
