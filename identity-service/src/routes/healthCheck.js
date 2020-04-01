const config = require('../config.js')
const models = require('../models')
const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { sequelize } = require('../models')
const { getRelayerFunds } = require('../txRelay')
const Web3 = require('web3')

const axios = require('axios')

let notifDiscProv = config.get('notificationDiscoveryProvider')

// Defaults used in relay health check endpoint
const RELAY_HEALTH_ONE_HOUR_AGO_BLOCKS = 720 // 5 blocks/sec = 720 blocks/hr
const RELAY_HEALTH_MAX_TRANSACTIONS = 100 // max transactions to look into
const RELAY_HEALTH_MAX_ERRORS = 5 // max acceptable errors for a 200 response
const RELAY_HEALTH_ACCOUNT = config.get('relayerPublicKey')

module.exports = function (app) {
  /**
   * Relay health check endpoint. Takes the query params startBlock, endBlock, maxTransactions, and maxErrors.
   * If those query params are not specified, use default values.
   */
  app.get('/health_check/relay', handleResponse(async (req, res) => {
    const start = Date.now()
    const audiusLibsInstance = req.app.get('audiusLibs')
    const web3 = audiusLibsInstance.web3Manager.getWeb3()

    let endBlockNumber = req.query.endBlock || (await web3.eth.getBlockNumber())
    // In the case that no query params are defined and the endBlockNumber is less than 720, default startBlockNumber to 0
    const defaultStartBlockNumber = endBlockNumber - RELAY_HEALTH_ONE_HOUR_AGO_BLOCKS >= 0
      ? endBlockNumber - RELAY_HEALTH_ONE_HOUR_AGO_BLOCKS : 0
    let startBlockNumber = req.query.startBlock || defaultStartBlockNumber
    let maxTransactions = req.query.maxTransactions || RELAY_HEALTH_MAX_TRANSACTIONS
    let maxErrors = req.query.maxErrors || RELAY_HEALTH_MAX_ERRORS

    // Parse query strings into ints as all req.query values come in as strings
    startBlockNumber = parseInt(startBlockNumber)
    endBlockNumber = parseInt(endBlockNumber)
    maxTransactions = parseInt(maxTransactions)
    maxErrors = parseInt(maxErrors)

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

    if (endBlockNumber - startBlockNumber > 1000) {
      return errorResponseServerError(`Block difference is over 1000. startBlock: ${startBlockNumber}, endBlock: ${endBlockNumber}`)
    }

    if (
      isNaN(maxTransactions) ||
      isNaN(maxErrors) ||
      maxTransactions < 0 ||
      maxErrors < 0
    ) {
      return errorResponseServerError(`Invalid number of transactions and/or number of errors. maxTransactions: ${maxTransactions}, maxErrors: ${maxErrors}`)
    }

    let failureTxHashes = []
    let txCounter = 0

    req.logger.info(
      `Searching for transactions to/from account ${RELAY_HEALTH_ACCOUNT} within blocks ${startBlockNumber} and ${endBlockNumber}`
    )

    // Iterate through the range of blocks, looking into the max number of transactions that are from audius
    for (let i = endBlockNumber; i > startBlockNumber; i--) {
      // If the max number of transactions have been evaluated, break out
      if (txCounter > maxTransactions) break
      let block = await web3.eth.getBlock(i, true)
      if (block && block.transactions.length) {
        for (const tx of block.transactions) {
          // If transaction is from audius account, determine success or fail status
          if (RELAY_HEALTH_ACCOUNT === tx.from) {
            const txHash = tx.hash
            const resp = await web3.eth.getTransactionReceipt(txHash)
            txCounter++
            if (!resp.status) failureTxHashes.push(txHash)
          }
        }
      }
    }

    const serverResponse = {
      numberOfTransactions: maxTransactions,
      numberOfFailedTransactions: failureTxHashes.length,
      failedTransactionHashes: failureTxHashes,
      startBlock: startBlockNumber,
      endBlock: endBlockNumber,
      timeElapsed: Date.now() - start
    }

    if (failureTxHashes.length > maxErrors) return errorResponseServerError(serverResponse)
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
}
