const _ = require('lodash')

const models = require('../../models')
const { Transaction } = require('sequelize')
const DBManager = require('../../dbManager')

/**
 * Exports all db data (not files) associated with walletPublicKey[] as JSON.
 *
 * @return {
 *  cnodeUsersDict - Map Object containing all db data keyed on cnodeUserUUID
 * }
 */
const exportComponentService = async ({
  walletPublicKeys,
  requestedClockRangeMin,
  requestedClockRangeMax,
  forceExport = false,
  logger
}) => {
  const transaction = await models.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ
  })

  const cnodeUsersDict = {}
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

    /** Bundle all data into cnodeUser objects to maximize import speed. */
    for (const cnodeUser of cnodeUsers) {
      // Add cnodeUserUUID data fields
      cnodeUser.audiusUsers = []
      cnodeUser.tracks = []
      cnodeUser.files = []
      cnodeUser.clockRecords = []

      cnodeUsersDict[cnodeUser.cnodeUserUUID] = cnodeUser
      const curCnodeUserClockVal = cnodeUser.clock

      // Resets cnodeUser clock value to requestedClockRangeMax to ensure consistency with clockRecords data
      if (cnodeUser.clock > requestedClockRangeMax) {
        // since clockRecords are returned by clock ASC, clock val at last index is largest clock val
        cnodeUser.clock = requestedClockRangeMax
        logger.info(
          `exportComponentService() - cnodeUserUUID:${cnodeUser.cnodeUserUUID} - cnodeUser clock val ${curCnodeUserClockVal} is higher than requestedClockRangeMax, reset to ${requestedClockRangeMax}`
        )
      }

      // Validate clock values or throw an error
      const maxClockRecord = Math.max(
        ...clockRecords.map((record) => record.clock)
      )
      if (!_.isEmpty(clockRecords) && cnodeUser.clock !== maxClockRecord) {
        const errorMsg = `Cannot export - exported data is not consistent. Exported max clock val = ${cnodeUser.clock} and exported max ClockRecord val ${maxClockRecord}. Fixing and trying again...`
        logger.error(
          `exportComponentService() - cnodeUserUUID:${cnodeUser.cnodeUserUUID} - ${errorMsg}`
        )

        if (!forceExport) {
          throw new Error(errorMsg)
        }
      }

      // Ensure localClockMax represents actual CNodeUser clock value from full data, so secondary knows there is more data to sync
      cnodeUser.clockInfo = {
        requestedClockRangeMin,
        requestedClockRangeMax,
        localClockMax: curCnodeUserClockVal
      }
    }

    audiusUsers.forEach((audiusUser) => {
      cnodeUsersDict[audiusUser.cnodeUserUUID].audiusUsers.push(audiusUser)
    })
    tracks.forEach((track) => {
      cnodeUsersDict[track.cnodeUserUUID].tracks.push(track)
    })
    files.forEach((file) => {
      cnodeUsersDict[file.cnodeUserUUID].files.push(file)
    })
    clockRecords.forEach((clockRecord) => {
      cnodeUsersDict[clockRecord.cnodeUserUUID].clockRecords.push(clockRecord)
    })

    await transaction.commit()

    return cnodeUsersDict
  } catch (e) {
    await transaction.rollback()

    for (const cnodeUserUUID in cnodeUsersDict) {
      try {
        const numRowsUpdated = await DBManager.fixInconsistentUser(
          cnodeUserUUID
        )
        logger.warn(
          `exportComponentService() - cnodeUserUUID:${cnodeUserUUID} - fixInconsistentUser() executed - numRowsUpdated:${numRowsUpdated}`
        )
      } catch (e) {
        logger.error(
          `exportComponentService() - cnodeUserUUID:${cnodeUserUUID} - fixInconsistentUser() error - ${e.message}`
        )
      }
    }
    throw new Error(e)
  }
}

module.exports = exportComponentService
