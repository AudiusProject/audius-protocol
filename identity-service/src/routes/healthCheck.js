const config = require('../config.js')
const models = require('../models')
const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { sequelize } = require('../models')
const { getRelayerFunds } = require('../txRelay')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('https://poa-gateway.audius.co'))

const axios = require('axios')

let notifDiscProv = config.get('notificationDiscoveryProvider')

/**
 * Helper method to sanitize query params
 * @param {} startBlock startBlock value
 * @param {*} endBlock endBlock value
 */
const validateQueryParams = (startBlock, endBlock) => {
  let errorMessage = ''

  /* If startBlock and/or endBlock:
      1. startBlock and/or endBlock are/is not whole number(s)
      2. endBlock is less than startBlock
      3. startBlock and/or endBlock are/is negative
      4. the difference is over 1000
    return a server error
  */
  if (isNaN(startBlock) || isNaN(endBlock) || parseFloat(startBlock) % 1 !== 0 || parseFloat(endBlock) % 1 !== 0) {
    errorMessage = 'Please use positive, whole numbers for startBlock and endBlock'
  }

  endBlock = parseInt(endBlock)
  startBlock = parseInt(startBlock)

  if (endBlock < startBlock) {
    errorMessage = 'endBlock value must be greater than startBlock value'
  } else if (startBlock < 0 || endBlock < 0) {
    errorMessage = 'startBlock and endBlock can not be negative'
  } else if (endBlock - startBlock > 1000) {
    errorMessage = 'Block difference is over the limit of 1000'
  }

  if (errorMessage) {
    return errorResponseServerError(`${errorMessage}: startBlock=${startBlock}, endBlock=${endBlock}`)
  }
}

module.exports = function (app) {
  /**
   * Relay health check endpoint. Takes the query params startBlock, endBlock, and account. If those query params
   * are not specified, default to config settings
   */
  app.get('/health_check/relay', handleResponse(async (req, res) => {
    const start = Date.now()
    const ONE_HOUR_AGO_BLOCKS = 720 // 5 blocks/sec = 720 blocks/hr
    const MAX_TRANSACTIONS = 100 // max transactions look into
    const MAX_ERRORS = 5 // max acceptable errors for a 200 response
    const ACCOUNT = '0xdead88167Bd06Cbc251FB8336B44259c6407dd07' // eth wallet

    let endBlockNumber = req.query.endBlock || (await web3.eth.getBlockNumber())
    let startBlockNumber = req.query.startBlock || endBlockNumber - ONE_HOUR_AGO_BLOCKS

    // If query params are invalid, throw server error
    const invalidQueryParamsError = validateQueryParams(startBlockNumber, endBlockNumber)
    if (invalidQueryParamsError) return invalidQueryParamsError

    // Parse startBlockNumber and endBlockNumber into integers as query params values are strings
    endBlockNumber = parseInt(endBlockNumber)
    startBlockNumber = parseInt(startBlockNumber)

    let failureTxHashes = []
    let txCounter = 0

    req.logger.info(
      `Searching for transactions to/from account ${ACCOUNT} within blocks ${startBlockNumber} and ${endBlockNumber}`
    )
    // Search for the last 100 transactions
    for (let i = endBlockNumber; i > startBlockNumber; i--) {
      if (txCounter > MAX_TRANSACTIONS) break
      let block = await web3.eth.getBlock(i, true)
      if (block && block.transactions.length) {
        for (const tx of block.transactions) {
          // If transaction is from audius account, determine success or fail status
          if (ACCOUNT === tx.from) {
            const txHash = tx.hash
            const resp = await web3.eth.getTransactionReceipt(txHash)
            txCounter++
            req.logger.info(`Found transaction: ${resp}`)
            if (!resp.status) failureTxHashes.push(txHash)
          }
        }
      }
    }

    const serverResponse = {
      numberOfTransactions: MAX_TRANSACTIONS,
      numberOfFailedTransactions: failureTxHashes.length,
      failedTransactionHashes: failureTxHashes,
      startBlock: startBlockNumber,
      endBlock: endBlockNumber,
      timeElapsed: Date.now() - start
    }

    if (failureTxHashes > MAX_ERRORS) return errorResponseServerError(serverResponse)
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
