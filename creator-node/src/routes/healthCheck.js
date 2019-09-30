const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { sequelize } = require('../models')
const config = require('../config.js')
const versionInfo = require('../../.version.json')
const disk = require('diskusage')

const MAX_DB_CONNECTIONS = 90
const MAX_DISK_USAGE_PERCENT = 90 // 90%

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

  /**
   * Exposes current and max db connection stats.
   * Returns error if db connection threshold exceeded, else success.
   */
  app.get('/db_check', handleResponse(async (req, res) => {
    const verbose = (req.query.verbose === 'true')
    const maxConnections = parseInt(req.query.maxConnections) || MAX_DB_CONNECTIONS

    let numConnections = 0
    let connectionInfo = null
    let activeConnections = null
    let idleConnections = null

    // Get number of open DB connections
    let numConnectionsQuery = await sequelize.query("SELECT numbackends from pg_stat_database where datname = 'audius_creator_node'")
    if (numConnectionsQuery && numConnectionsQuery[0] && numConnectionsQuery[0][0] && numConnectionsQuery[0][0].numbackends) {
      numConnections = numConnectionsQuery[0][0].numbackends
    }

    // Get detailed connection info
    const connectionInfoQuery = (await sequelize.query("select wait_event_type, wait_event, state, query from pg_stat_activity where datname = 'audius_creator_node'"))
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
      maxConnections: maxConnections,
    }

    if (verbose) { resp.connectionInfo = connectionInfo }

    return (numConnections >= maxConnections) ? errorResponseServerError(resp) : successResponse(resp)
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

  /**
   * Exposes current and max disk usage stats.
   * Returns error if max disk usage exceeded, else success.
   */
  app.get('/disk_check', handleResponse(async (req, res) => {
    const maxUsageBytes = parseInt(req.query.maxUsageBytes)
    const maxUsagePercent = parseInt(req.query.maxUsagePercent) || MAX_DISK_USAGE_PERCENT
    
    const path = config.get('storagePath')
    const { available, total } = await disk.check(path)
    const usagePercent = Math.round((total - available) * 100 / total)

    const resp = {
      available: _formatBytes(available),
      total: _formatBytes(total),
      usagePercent: `${usagePercent}%`,
      maxUsagePercent: `${maxUsagePercent}%`
    }

    if (maxUsageBytes) { resp.maxUsage = _formatBytes(maxUsageBytes) }

    if (usagePercent >= maxUsagePercent ||
      (maxUsageBytes && (total - available) >= maxUsageBytes)
    ) {
      return errorResponseServerError(resp)
    } else {
      return successResponse(resp)
    }
  }))
}

function _formatBytes (bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
