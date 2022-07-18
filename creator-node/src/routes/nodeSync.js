const models = require('../models')
const {
  handleResponse,
  successResponse,
  errorResponse,
  errorResponseServerError
} = require('../apiHelpers')
const config = require('../config')
const retry = require('async-retry')
const { Transaction } = require('sequelize')

module.exports = function (app) {
  /**
   * Exports all db data (not files) associated with walletPublicKey[] as JSON.
   *
   * This route is only run on a user's primary, to export data to the user's secondaries.
   *
   * @return {
   *  cnodeUsers Map Object containing all db data keyed on cnodeUserUUID
   * }
   */
  app.get(
    '/export',
    handleResponse(async (req, res) => {
      const start = Date.now()

      const walletPublicKeys = req.query.wallet_public_key // array
      const sourceEndpoint = req.query.source_endpoint // string

      const maxExportClockValueRange = config.get('maxExportClockValueRange')

      // Define clock range (min and max) for export
      const requestedClockRangeMin = parseInt(req.query.clock_range_min) || 0
      const requestedClockRangeMax =
        requestedClockRangeMin + (maxExportClockValueRange - 1)

      let cnodeUsersDict

      try {
        cnodeUsersDict = await retry(
          async () => {
            const transaction = await models.sequelize.transaction({
              isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ
            })

            let cnodeUsersDictInner

            try {
              // Fetch cnodeUser for each walletPublicKey.
              const cnodeUsers = await models.CNodeUser.findAll({
                where: { walletPublicKey: walletPublicKeys },
                transaction,
                raw: true
              })
              const cnodeUserUUIDs = cnodeUsers.map(
                (cnodeUser) => cnodeUser.cnodeUserUUID
              )

              // Fetch all data for cnodeUserUUIDs: audiusUsers, tracks, files, clockRecords.

              const [audiusUsers, tracks, files, clockRecords] =
                await Promise.all([
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

              /** Bundle all data into cnodeUser objects to maximize import speed. */

              cnodeUsersDictInner = {}
              cnodeUsers.forEach((cnodeUser) => {
                // Add cnodeUserUUID data fields
                cnodeUser.audiusUsers = []
                cnodeUser.tracks = []
                cnodeUser.files = []
                cnodeUser.clockRecords = []

                cnodeUsersDictInner[cnodeUser.cnodeUserUUID] = cnodeUser
                const curCnodeUserClockVal = cnodeUser.clock

                // Validate clock values or throw an error
                const maxClockRecordId = Math.max(
                  ...clockRecords.map((record) => record.clock)
                )
                if (cnodeUser.clock !== maxClockRecordId) {
                  throw new Error(
                    `Cannot export - exported data is not consistent. Exported max clock val = ${cnodeUser.clock} and exported max ClockRecord val ${maxClockRecordId}`
                  )
                }

                // Resets cnodeUser clock value to requestedClockRangeMax to ensure consistency with clockRecords data
                // Also ensures secondary knows there is more data to sync
                if (cnodeUser.clock > requestedClockRangeMax) {
                  // since clockRecords are returned by clock ASC, clock val at last index is largest clock val
                  cnodeUser.clock = requestedClockRangeMax
                  req.logger.info(
                    `nodeSync.js#export - cnodeUser clock val ${curCnodeUserClockVal} is higher than requestedClockRangeMax, reset to ${requestedClockRangeMax}`
                  )
                }

                cnodeUser.clockInfo = {
                  requestedClockRangeMin,
                  requestedClockRangeMax,
                  localClockMax: cnodeUser.clock
                }
              })

              audiusUsers.forEach((audiusUser) => {
                cnodeUsersDictInner[audiusUser.cnodeUserUUID].audiusUsers.push(
                  audiusUser
                )
              })
              tracks.forEach((track) => {
                cnodeUsersDictInner[track.cnodeUserUUID].tracks.push(track)
              })
              files.forEach((file) => {
                cnodeUsersDictInner[file.cnodeUserUUID].files.push(file)
              })
              clockRecords.forEach((clockRecord) => {
                cnodeUsersDictInner[
                  clockRecord.cnodeUserUUID
                ].clockRecords.push(clockRecord)
              })

              req.logger.info(
                `Successful export for wallets ${walletPublicKeys} to source endpoint ${
                  sourceEndpoint || '(not provided)'
                } for clock value range [${requestedClockRangeMin},${requestedClockRangeMax}] || route duration ${
                  Date.now() - start
                } ms`
              )

              await transaction.commit()
            } catch (e) {
              req.logger.error(
                `Error in /export for wallets ${walletPublicKeys} to source endpoint ${
                  sourceEndpoint || '(not provided)'
                } for clock value range [${requestedClockRangeMin},${requestedClockRangeMax}] || route duration ${
                  Date.now() - start
                } ms ||`,
                e
              )
              await transaction.rollback()
            }

            return cnodeUsersDictInner
          },
          {
            retries: 3
          }
        )

        return successResponse({ cnodeUsers: cnodeUsersDict })
      } catch (e) {
        req.logger.error(
          `Error in /export for wallets ${walletPublicKeys} to source endpoint ${
            sourceEndpoint || '(not provided)'
          } for clock value range [${requestedClockRangeMin},${requestedClockRangeMax}] || route duration ${
            Date.now() - start
          } ms ||`,
          e
        )
        return errorResponseServerError(e.message)
      }
    })
  )

  /** Checks if node sync is in progress for wallet. */
  app.get(
    '/sync_status/:walletPublicKey',
    handleResponse(async (req, res) => {
      const walletPublicKey = req.params.walletPublicKey

      const redisClient = req.app.get('redisClient')
      if (await redisClient.WalletWriteLock.syncIsInProgress(walletPublicKey)) {
        return errorResponse(
          423,
          `Cannot change state of wallet ${walletPublicKey}. Node sync currently in progress.`
        )
      }

      // Get & return latestBlockNumber for wallet
      const cnodeUser = await models.CNodeUser.findOne({
        where: { walletPublicKey }
      })
      const latestBlockNumber = cnodeUser ? cnodeUser.latestBlockNumber : -1
      const clockValue = cnodeUser ? cnodeUser.clock : -1

      return successResponse({ walletPublicKey, latestBlockNumber, clockValue })
    })
  )
}
