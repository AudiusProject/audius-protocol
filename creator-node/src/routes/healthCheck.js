const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { sequelize } = require('../models')
const config = require('../config.js')
const versionInfo = require('../../.version.json')
const disk = require('diskusage')

const DiskManager = require('../diskManager')

const MAX_DB_CONNECTIONS = config.get('dbConnectionPoolMax')
const MAX_DISK_USAGE_PERCENT = 90 // 90%

module.exports = function (app) {
  /**
   * Performs diagnostic ipfs operations to confirm functionality
   */
  app.get('/health_check/ipfs', handleResponse(async (req, res) => {
    if (config.get('isReadOnlyMode')) {
      res.status(400)
      return
    }

    const ipfs = req.app.get('ipfsAPI')
    try {
      const start = Date.now()
      const timestamp = start.toString()
      const content = Buffer.from(timestamp)

      // Add new buffer created from timestamp (without pin)
      const results = await ipfs.add(content, { pin: false })
      const hash = results[0].hash // "Qm...WW"

      // Retrieve and validate hash from local node
      const ipfsResp = await ipfs.get(hash)
      const ipfsRespStr = ipfsResp[0].content.toString()
      const isValidResponse = (ipfsRespStr === timestamp)

      // Test pin ops if requested
      if (req.query.pin === 'true') {
        await ipfs.pin.add(hash)
        await ipfs.pin.rm(hash)
      }

      const duration = `${Date.now() - start}ms`
      return successResponse({ hash, isValidResponse, duration })
    } catch (e) {
      return errorResponseServerError({ error: e })
    }
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
      maxConnections: maxConnections
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

    const storagePath = DiskManager.getConfigStoragePath()
    const { available, total } = await disk.check(storagePath)
    const usagePercent = Math.round((total - available) * 100 / total)

    const resp = {
      available: _formatBytes(available),
      total: _formatBytes(total),
      usagePercent: `${usagePercent}%`,
      maxUsagePercent: `${maxUsagePercent}%`,
      storagePath
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
