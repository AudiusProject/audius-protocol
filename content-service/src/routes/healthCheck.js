const { handleResponse, successResponse } = require('../apiHelpers')
const { sequelize } = require('../models')
const versionInfo = require('../../.version.json')

module.exports = function (app) {
  app.get('/health_check', handleResponse(async (req, res) => {
    // for now we just check db connectivity. In future, this could / should check other
    // things (ex. IPFS)
    await sequelize.query('SELECT 1', { type: sequelize.QueryTypes.SELECT })
    return successResponse({ 'healthy': true, 'GIT_SHA': process.env.GIT_SHA })
  }))

  app.get('/version', handleResponse(async (req, res) => {
    return successResponse(versionInfo)
  }))
}
