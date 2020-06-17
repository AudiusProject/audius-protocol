const disk = require('diskusage')
const axios = require('axios')
const ethSigUtil = require('eth-sig-util')

const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { authMiddleware, crossCnodeAuth } = require('../middlewares')
const { sequelize } = require('../models')
const config = require('../config.js')
const versionInfo = require('../../.version.json')
const utils = require('../utils')

const MAX_DB_CONNECTIONS = 90
const MAX_DISK_USAGE_PERCENT = 90 // 90%

module.exports = function (app) {
  /** Call this to tell CN to call another CN's /permission route to test cross-CN auth */
  app.get('/test', handleResponse(async (req, res) => {
    const redisClient = req.app.get('redisClient')

    // url of cnode to auth against
    const cnodeURL = req.query.cnodeURL // string
    const artistWallet = req.query.artistWallet // string

    // TODO validate redisClient + cnodeURL + lowercase cnodeURL

    const delegateOwnerWallet = config.get('delegateOwnerWallet')
    const delegatePrivateKey = config.get('delegatePrivateKey')
    console.log(`delegateOwnerWallet: ${delegateOwnerWallet}; delegatePrivateKey: ${delegatePrivateKey}`)
    // TODO validate delegateOwnerWallet - is this needed?

    // check if authToken exists for dest cnodeURL
    const authTokenRKey = `authToken::${cnodeURL}`
    let authToken = await redisClient.get(authTokenRKey)

    if (authToken) {
      console.log(`authToken found: ${authToken}`)

      // delete authToken each time for testing purposes - will remove
      await redisClient.del(authTokenRKey)
      authToken = null
    } else {
      console.log('authToken NOT found')
    }

    const spID = config.get('spID')
    if (!spID) { return errorResponseServerError('Cannot auth against other CNodes since self is not registered on-chain') } else {
      console.log(`spID found: ${spID}`)
    }

    // If no authToken, signup + login on dstCnode
    if (!authToken) {
      // Signup on dstCnode with delegateOwnerWallet
      await axios({
        method: 'post',
        baseURL: cnodeURL,
        url: '/users',
        data: { 'walletAddress': delegateOwnerWallet, 'spID': spID },
        responseType: 'json'
      })

      // Get login challenge
      const challengeResp = await axios({
        method: 'get',
        baseURL: cnodeURL,
        url: '/users/login/challenge',
        params: { 'walletPublicKey': delegateOwnerWallet }
      })
      const challengeKey = challengeResp.data.challenge

      // Sign challenge with private key
      const pkBuffer = Buffer.from(delegatePrivateKey.substring(2), 'hex')
      const sig = ethSigUtil.personalSign(pkBuffer, { data: challengeKey })

      // Submit login challenge response for verification
      const challengeResp2 = await axios({
        method: 'post',
        baseURL: cnodeURL,
        url: '/users/login/challenge',
        data: {
          'data': challengeKey,
          'signature': sig
        }
      })
      console.log('post login challenge success', challengeResp2.data)

      authToken = challengeResp2.data.sessionToken
      await redisClient.set(authTokenRKey, authToken)
    }

    // Attempt to call permissioned route
    const testResp = await axios({
      method: 'get',
      baseURL: cnodeURL,
      url: '/test_permission',
      params: { 'artistWallet': artistWallet },
      headers: { 'X-Session-ID': authToken },
      responseType: 'json'
    })
    // If resp successful, indicates auth worked
    return successResponse(testResp.data)
  }))

  /** CN ensures that caller is authed */
  app.get('/test_permission', authMiddleware, crossCnodeAuth, handleResponse(async (req, res) => {
    return successResponse('yes')
  }))

  /** @dev TODO - Explore checking more than just DB (ex. IPFS) */
  app.get('/health_check', handleResponse(async (req, res) => {
    const libs = req.app.get('audiusLibs')

    let response = {
      ...versionInfo,
      'healthy': true,
      'git': process.env.GIT_SHA,
      'selectedDiscoveryProvider': 'none'
    }

    if (libs) {
      response.selectedDiscoveryProvider = req.app.get('audiusLibs').discoveryProvider.discoveryProviderEndpoint
    }

    return successResponse(response)
  }))

  /**
   * Performs diagnostic ipfs operations to confirm functionality
   */
  app.get('/health_check/ipfs', handleResponse(async (req, res) => {
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

    const path = config.get('storagePath')
    const { available, total } = await disk.check(path)
    const usagePercent = Math.round((total - available) * 100 / total)

    const resp = {
      available: utils.formatBytes(available),
      total: utils.formatBytes(total),
      usagePercent: `${usagePercent}%`,
      maxUsagePercent: `${maxUsagePercent}%`
    }

    if (maxUsageBytes) { resp.maxUsage = utils.formatBytes(maxUsageBytes) }

    if (usagePercent >= maxUsagePercent ||
      (maxUsageBytes && (total - available) >= maxUsageBytes)
    ) {
      return errorResponseServerError(resp)
    } else {
      return successResponse(resp)
    }
  }))
}
