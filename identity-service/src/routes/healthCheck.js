const config = require('../config.js')
const models = require('../models')
const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { sequelize } = require('../models')
const { getRelayerFunds } = require('../txRelay')
const Web3 = require('web3')
const axios = require('axios')

let notifDiscProv = config.get('notificationDiscoveryProvider')

module.exports = function (app) {
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
