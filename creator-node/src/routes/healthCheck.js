const { handleResponse, successResponse } = require('../apiHelpers')
const { sequelize } = require('../models')
const config = require('../config.js')
const versionInfo = require('../../.version.json')

module.exports = function (app) {
  /** @dev TODO - Explore checking more than just DB (ex. IPFS) */
  app.get('/health_check', handleResponse(async (req, res) => {
    const libs = req.app.get('audiusLibs')
    return successResponse({
      'healthy': true,
      'git': process.env.GIT_SHA,
      'selectedDiscoveryProvider': libs.discoveryProvider.discoveryProviderEndpoint || 'none',
    })
  }))

  app.get('/db_check', handleResponse(async (req, res) => {
    let numConnections = 0
    let connectionInfo = null

    let numConnectionsQuery = await sequelize.query("SELECT numbackends from pg_stat_database where datname = 'audius_creator_node'")
    if (numConnectionsQuery && numConnectionsQuery[0] && numConnectionsQuery[0][0] && numConnectionsQuery[0][0].numbackends) {
      numConnections = numConnectionsQuery[0][0].numbackends
    }

    let connectionInfoQuery = (await sequelize.query("select datname, usename, application_name, client_addr, wait_event_type, wait_event, state, query, backend_type from pg_stat_activity where datname = 'audius_creator_node'"))
    if (connectionInfoQuery && connectionInfoQuery[0]) {
      connectionInfo = connectionInfoQuery[0]
    }
    req.logger.info('numConnections', numConnections)
    req.logger.info('connectionInfo', connectionInfo)

    return successResponse({
      'healthy': true,
      'git': process.env.GIT_SHA,
      numConnections,
      connectionInfo
    })
  }))

  app.get('/version', handleResponse(async (req, res) => {
    const info = {
      ...versionInfo,
      country: config.get('serviceCountry'),
      latitude: config.get('serviceLatitude'),
      longitude: config.get('serviceLongitude')
    }
    return successResponse(info)
  }))
}
