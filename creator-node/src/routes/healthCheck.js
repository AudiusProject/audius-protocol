const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { sequelize } = require('../models')
const config = require('../config.js')
const versionInfo = require('../../.version.json')
const disk = require('diskusage');

const HUNDRED_GB_IN_BYTES = 1000 * 1000 * 1000 * 100 // 1 kb, 1mb, 1gb * 100

module.exports = function (app) {
  /** @dev TODO - Explore checking more than just DB (ex. IPFS) */
  app.get('/health_check', handleResponse(async (req, res) => {
    const libs = req.app.get('audiusLibs')
    return successResponse({
      'healthy': true,
      'git': process.env.GIT_SHA,
      'selectedDiscoveryProvider': libs.discoveryProvider.discoveryProviderEndpoint || 'none'
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

  app.get('/disk_check', handleResponse(async (req, res) => {
    const path = config.get('storagePath')
    const { available, total } = await disk.check(path);
    console.log(available / total)
    
    // if less than 20% of hard disk space is available or if
    // if (available / total < .20 && available > HUNDRED_GB_IN_BYTES){
      return successResponse({
        available: _formatBytes(available),
        total: _formatBytes(total)
      })
    // }
    // else {
    //   return errorResponseServerError({
    //     available: _formatBytes(available),
    //     total: _formatBytes(total)
    //   })
    // }
  }))
}

function _formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
