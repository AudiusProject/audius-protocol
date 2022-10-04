import type Logger from 'bunyan'

import _ from 'lodash'
import { Transaction } from 'sequelize'
import DBManager from '../../dbManager'
import { instrumentTracing, tracing } from '../../tracer'

const models = require('../../models')
/**
 * Exports all db data (not files) associated with walletPublicKey[] as JSON.
 *
 * @return {
 *  cnodeUsersDict - Map Object containing all db data keyed on cnodeUserUUID
 * }
 */
const _exportComponentService = async ({
  walletPublicKeys,
  requestedClockRangeMin,
  requestedClockRangeMax,
  forceExport = false,
  logger
}: {
  walletPublicKeys: string[]
  requestedClockRangeMin: number
  requestedClockRangeMax: number
  forceExport: boolean
  logger: Logger
}) => {
  const transaction = await models.sequelize.transaction({
    isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ
  })

  const cnodeUsersDict: any = {}
  try {
    // Fetch cnodeUser for each walletPublicKey.
    const cnodeUsers = await models.CNodeUser.findAll({
      where: { walletPublicKey: walletPublicKeys },
      transaction,
      raw: true
    })
    const cnodeUserUUIDs = cnodeUsers.map(
      (cnodeUser: { cnodeUserUUID: string }) => cnodeUser.cnodeUserUUID
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
      const cnodeUserResp = _.cloneDeep(cnodeUser)
      // Add cnodeUserUUID data fields
      cnodeUserResp.audiusUsers = []
      cnodeUserResp.tracks = []
      cnodeUserResp.files = []
      cnodeUserResp.clockRecords = []

      const curCnodeUserClockVal = cnodeUserResp.clock

      // Resets cnodeUser clock value to requestedClockRangeMax to ensure consistency with clockRecords data
      if (cnodeUserResp.clock > requestedClockRangeMax) {
        cnodeUserResp.clock = requestedClockRangeMax
        logger.info(
          `exportComponentService() - cnodeUserUUID:${cnodeUserResp.cnodeUserUUID} - cnodeUser clock val ${curCnodeUserClockVal} is higher than requestedClockRangeMax, reset to ${requestedClockRangeMax}`
        )
      }

      // Validate clock values or throw an error
      const maxClockRecord = Math.max(
        ...clockRecords.map((record: any) => record.clock)
      )
      if (!_.isEmpty(clockRecords) && cnodeUserResp.clock !== maxClockRecord) {
        const errorMsg = `Cannot export - exported data is not consistent. Exported max clock val = ${cnodeUserResp.clock} and exported max ClockRecord val ${maxClockRecord}. Fixing and trying again...`
        logger.error(
          `exportComponentService() - cnodeUserUUID:${cnodeUserResp.cnodeUserUUID} - ${errorMsg}`
        )

        if (!forceExport) {
          throw new Error(errorMsg)
        }
      }

      // Ensure localClockMax represents actual CNodeUser clock value from full data, so secondary knows there is more data to sync
      cnodeUserResp.clockInfo = {
        requestedClockRangeMin,
        requestedClockRangeMax,
        localClockMax: curCnodeUserClockVal
      }

      cnodeUsersDict[cnodeUserResp.cnodeUserUUID as string] = cnodeUserResp
    }

    audiusUsers.forEach((audiusUser: any) => {
      cnodeUsersDict[audiusUser.cnodeUserUUID].audiusUsers.push(audiusUser)
    })
    tracks.forEach((track: any) => {
      cnodeUsersDict[track.cnodeUserUUID].tracks.push(track)
    })
    files.forEach((file: any) => {
      cnodeUsersDict[file.cnodeUserUUID].files.push(file)
    })
    clockRecords.forEach((clockRecord: any) => {
      cnodeUsersDict[clockRecord.cnodeUserUUID].clockRecords.push(clockRecord)
    })

    await transaction.commit()

    return cnodeUsersDict
  } catch (e: any) {
    tracing.recordException(e)
    await transaction.rollback()

    for (const cnodeUserUUID in cnodeUsersDict) {
      try {
        const numRowsUpdated = await DBManager.fixInconsistentUser(
          cnodeUserUUID
        )
        logger.warn(
          `exportComponentService() - cnodeUserUUID:${cnodeUserUUID} - fixInconsistentUser() executed - numRowsUpdated:${numRowsUpdated}`
        )
      } catch (e: any) {
        tracing.recordException(e)
        logger.error(
          `exportComponentService() - cnodeUserUUID:${cnodeUserUUID} - fixInconsistentUser() error - ${e.message}`
        )
      }
    }
    throw new Error(e)
  }
}

export const exportComponentService = instrumentTracing({
  fn: _exportComponentService,
  options: {
    attributes: {
      [tracing.CODE_FILEPATH]: __filename
    }
  }
})

module.exports = {
  exportComponentService
}
