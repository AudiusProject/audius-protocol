const config = require('../config.js')
const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { sequelize } = require('../models')
const { getRelayerFunds } = require('../txRelay')
const Web3 = require('web3')

module.exports = function (app) {
  app.get('/health_check', handleResponse(async (req, res) => {
    // for now we just check db connectivity
    await sequelize.query('SELECT 1', { type: sequelize.QueryTypes.SELECT })
    return successResponse({ 'healthy': true, 'GIT_SHA': process.env.GIT_SHA })
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
}
