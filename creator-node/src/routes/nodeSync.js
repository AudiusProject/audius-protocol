const models = require('../models')
const { handleResponse, successResponse, errorResponse, errorResponseServerError } = require('../apiHelpers')
const config = require('../config')
const { getIPFSPeerId } = require('../utils')

const SyncHistoryAggregator = require('../snapbackSM/syncHistoryAggregator')

module.exports = function (app) {
  /**
   * Exports all db data (not files) associated with walletPublicKey[] as JSON.
   * Returns IPFS node ID object, so importing nodes can peer manually for optimized file transfer.
   *
   * This route is only run on a user's primary, to export data to the user's secondaries.
   *
   * @return {
   *  cnodeUsers Map Object containing all db data keyed on cnodeUserUUID
   *  ipfsIDObj Object containing IPFS Node's peer ID
   * }
   */
  app.get('/export', handleResponse(async (req, res) => {
    const start = Date.now()

    const walletPublicKeys = req.query.wallet_public_key // array
    const sourceEndpoint = req.query.source_endpoint // string

    const maxExportClockValueRange = config.get('maxExportClockValueRange')

    // Define clock range (min and max) for export
    const requestedClockRangeMin = parseInt(req.query.clock_range_min) || 0
    const requestedClockRangeMax = requestedClockRangeMin + (maxExportClockValueRange - 1)

    const transaction = await models.sequelize.transaction()
    try {
      // Fetch cnodeUser for each walletPublicKey.
      const cnodeUsers = await models.CNodeUser.findAll({ where: { walletPublicKey: walletPublicKeys }, transaction, raw: true })
      const cnodeUserUUIDs = cnodeUsers.map((cnodeUser) => cnodeUser.cnodeUserUUID)

      // Fetch all data for cnodeUserUUIDs: audiusUsers, tracks, files, clockRecords.

      const [audiusUsers, tracks, files, clockRecords] = await Promise.all([
        models.AudiusUser.findAll({
          where: {
            cnodeUserUUID: cnodeUserUUIDs,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          transaction,
          raw: true
        }),
        models.Track.findAll({
          where: {
            cnodeUserUUID: cnodeUserUUIDs,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          transaction,
          raw: true
        }),
        models.File.findAll({
          where: {
            cnodeUserUUID: cnodeUserUUIDs,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          transaction,
          raw: true
        }),
        models.ClockRecord.findAll({
          where: {
            cnodeUserUUID: cnodeUserUUIDs,
            clock: {
              [models.Sequelize.Op.gte]: requestedClockRangeMin,
              [models.Sequelize.Op.lte]: requestedClockRangeMax
            }
          },
          order: [['clock', 'ASC']],
          transaction,
          raw: true
        })
      ])

      await transaction.commit()

      /** Bundle all data into cnodeUser objects to maximize import speed. */

      const cnodeUsersDict = {}
      cnodeUsers.forEach(cnodeUser => {
        // Add cnodeUserUUID data fields
        cnodeUser['audiusUsers'] = []
        cnodeUser['tracks'] = []
        cnodeUser['files'] = []
        cnodeUser['clockRecords'] = []

        cnodeUsersDict[cnodeUser.cnodeUserUUID] = cnodeUser
        const curCnodeUserClockVal = cnodeUser.clock

        // Resets cnodeUser clock value to requestedClockRangeMax to ensure consistency with clockRecords data
        // Also ensures secondary knows there is more data to sync
        if (cnodeUser.clock > requestedClockRangeMax) {
          // since clockRecords are returned by clock ASC, clock val at last index is largest clock val
          cnodeUser.clock = requestedClockRangeMax
          req.logger.info(`nodeSync.js#export - cnodeUser clock val ${curCnodeUserClockVal} is higher than requestedClockRangeMax, reset to ${requestedClockRangeMax}`)
        }

        cnodeUser['clockInfo'] = {
          requestedClockRangeMin,
          requestedClockRangeMax,
          localClockMax: cnodeUser.clock
        }
      })

      audiusUsers.forEach(audiusUser => {
        cnodeUsersDict[audiusUser.cnodeUserUUID]['audiusUsers'].push(audiusUser)
      })
      tracks.forEach(track => {
        cnodeUsersDict[track.cnodeUserUUID]['tracks'].push(track)
      })
      files.forEach(file => {
        cnodeUsersDict[file.cnodeUserUUID]['files'].push(file)
      })
      clockRecords.forEach(clockRecord => {
        cnodeUsersDict[clockRecord.cnodeUserUUID]['clockRecords'].push(clockRecord)
      })

      // Expose ipfs node's peer ID.
      const ipfs = req.app.get('ipfsAPI')
      const ipfsIDObj = await getIPFSPeerId(ipfs)

      req.logger.info(`Successful export for wallets ${walletPublicKeys} to source endpoint ${sourceEndpoint || '(not provided)'} for clock value range [${requestedClockRangeMin},${requestedClockRangeMax}] || route duration ${Date.now() - start} ms`)
      return successResponse({ cnodeUsers: cnodeUsersDict, ipfsIDObj })
    } catch (e) {
      req.logger.error(`Error in /export for wallets ${walletPublicKeys} to source endpoint ${sourceEndpoint || '(not provided)'} for clock value range [${requestedClockRangeMin},${requestedClockRangeMax}] || route duration ${Date.now() - start} ms ||`, e)
      await transaction.rollback()
      return errorResponseServerError(e.message)
    }
  }))

  /**
   * Returns sync history.
   * `aggregateSyncData` - the number of succesful, failed, and triggered syncs for the current day
   * `latestSyncData` - the date of the most recent successful and failed sync. will be `null` if no sync occurred with that state
   *
   * Structure:
   *  aggregateSyncData = {triggered: <number>, success: <number>, fail: <number>}
   *  latestSyncData = {success: <MM:DD:YYYYTHH:MM:SS:ssss>, fail: <MM:DD:YYYYTHH:MM:SS:ssss>}
   */
  app.get('/sync_history', handleResponse(async (req, res) => {
    const aggregateSyncData = await SyncHistoryAggregator.getAggregateSyncData(req.logContext)
    const latestSyncData = await SyncHistoryAggregator.getLatestSyncData(req.logContext)

    return successResponse({ aggregateSyncData, latestSyncData })
  }))

  /** Checks if node sync is in progress for wallet. */
  app.get('/sync_status/:walletPublicKey', handleResponse(async (req, res) => {
    const walletPublicKey = req.params.walletPublicKey
    const redisClient = req.app.get('redisClient')
    const lockHeld = await redisClient.lock.getLock(redisClient.getNodeSyncRedisKey(walletPublicKey))
    if (lockHeld) {
      return errorResponse(423, `Cannot change state of wallet ${walletPublicKey}. Node sync currently in progress.`)
    }

    // Get & return latestBlockNumber for wallet
    const cnodeUser = await models.CNodeUser.findOne({ where: { walletPublicKey } })
    const latestBlockNumber = (cnodeUser) ? cnodeUser.latestBlockNumber : -1
    const clockValue = (cnodeUser) ? cnodeUser.clock : -1

    return successResponse({ walletPublicKey, latestBlockNumber, clockValue })
  }))
}
