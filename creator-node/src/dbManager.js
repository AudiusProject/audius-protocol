const { logger } = require('./logging')
const models = require('./models')
const sequelize = models.sequelize

class DBManager {
  /**
   * Entrypoint for writes/destructive DB operations.
   *
   * Functionality:
   * A. Given file insert query object and cnodeUserUUID, inserts new file record in DB
   *    and handles all required clock management.
   * Steps:
   *  1. increments cnodeUser clock value by 1
   *  2. insert new ClockRecord entry with new clock value
   *  3. insert new Data Table (File, Track, AudiusUser) entry with queryObj and new clock value
   * In steps 2 and 3, clock values are read as subquery to guarantee atomicity
   *
   * B. Given a list of IDs, batch deletes user session tokens to expire sessions on the server-side.
   */
  static async createNewDataRecord (queryObj, cnodeUserUUID, sequelizeTableInstance, transaction) {
    // Increment CNodeUser.clock value by 1
    await models.CNodeUser.increment('clock', {
      where: { cnodeUserUUID },
      by: 1,
      transaction
    })

    const selectCNodeUserClockSubqueryLiteral = _getSelectCNodeUserClockSubqueryLiteral(cnodeUserUUID)

    // Add row in ClockRecords table using new CNodeUser.clock
    await models.ClockRecord.create({
      cnodeUserUUID,
      clock: selectCNodeUserClockSubqueryLiteral,
      sourceTable: sequelizeTableInstance.name
    }, { transaction })

    // Add cnodeUserUUID + clock value to queryObj
    queryObj.cnodeUserUUID = cnodeUserUUID
    queryObj.clock = selectCNodeUserClockSubqueryLiteral

    // Create new Data table entry with queryObj using new CNodeUser.clock
    const file = await sequelizeTableInstance.create(queryObj, { transaction })

    return file.dataValues
  }

  /**
   * Deletes all data for a cnodeUser from DB
   *
   * @notice This method is currently unused. It's a legacy function from non-diffed sync which might be needed in the future.
   *
   * @param {*} CNodeUserLookupObj
   * @param {*} sequelizeTableInstance
   * @param {*} tx
   */
  static async deleteAllCNodeUserDataFromDB ({ lookupCnodeUserUUID, lookupWallet }, externalTransaction) {
    const transaction = (externalTransaction) || (await models.sequelize.transaction())
    const log = (msg) => logger.info(`DBManager.deleteAllCNodeUserDataFromDB log: ${msg}`)

    const start = Date.now()
    let error
    try {
      const cnodeUserWhereFilter = (lookupWallet) ? { walletPublicKey: lookupWallet } : { cnodeUserUUID: lookupCnodeUserUUID }
      const cnodeUser = await models.CNodeUser.findOne({
        where: cnodeUserWhereFilter,
        transaction
      })
      log('cnodeUser', cnodeUser)

      // Exit successfully if no cnodeUser found
      // TODO - better way to do this?
      if (!cnodeUser) {
        throw new Error('No cnodeUser found')
      }

      const cnodeUserUUID = cnodeUser.cnodeUserUUID
      const cnodeUserUUIDLog = `cnodeUserUUID: ${cnodeUserUUID}`
      log(`${cnodeUserUUIDLog} || beginning delete ops`)

      const numAudiusUsersDeleted = await models.AudiusUser.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`${cnodeUserUUIDLog} || numAudiusUsersDeleted ${numAudiusUsersDeleted}`)

      // TrackFiles must be deleted before associated Tracks can be deleted
      const numTrackFilesDeleted = await models.File.destroy({
        where: {
          cnodeUserUUID,
          trackBlockchainId: { [models.Sequelize.Op.ne]: null } // Op.ne = notequal
        },
        transaction
      })
      log(`${cnodeUserUUIDLog} || numTrackFilesDeleted ${numTrackFilesDeleted}`)

      const numTracksDeleted = await models.Track.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`${cnodeUserUUIDLog} || numTracksDeleted ${numTracksDeleted}`)

      // Delete all remaining files (image / metadata files).
      const numNonTrackFilesDeleted = await models.File.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`${cnodeUserUUIDLog} || numNonTrackFilesDeleted ${numNonTrackFilesDeleted}`)

      const numClockRecordsDeleted = await models.ClockRecord.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`${cnodeUserUUIDLog} || numClockRecordsDeleted ${numClockRecordsDeleted}`)

      const numSessionTokensDeleted = await models.SessionToken.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`${cnodeUserUUIDLog} || numSessionTokensDeleted ${numSessionTokensDeleted}`)

      // Delete cnodeUser entry
      await cnodeUser.destroy({ transaction })
      log(`${cnodeUserUUIDLog} || cnodeUser entry deleted`)
    } catch (e) {
      if (e.message !== 'No cnodeUser found') {
        error = e
      }
    } finally {
      // Rollback transaction on error for external or internal transaction
      // TODO - consider not rolling back in case of external transaction, and just throwing instead
      if (error) {
        await transaction.rollback()
        log(`rolling back transaction due to error ${error}`)
      } else if (!externalTransaction) {
        // Commit transaction if no error and no external transaction provided
        await transaction.commit()
        log(`commited internal transaction`)
      }

      log(`completed in ${Date.now() - start}ms`)
    }
  }

  /**
   * Deletes all session tokens matching an Array of SessionTokens.
   *
   * @param {Array} sessionTokens from the SessionTokens table
   * @param {*} tx
   */
  static async deleteSessionTokensFromDB (sessionTokens, externalTransaction) {
    const transaction = (externalTransaction) || (await models.sequelize.transaction())
    const log = (msg) => logger.info(`DBManager.deleteSessionTokensFromDB || log: ${msg}`)
    const ids = sessionTokens.map(st => st.id)
    const start = Date.now()
    let error
    try {
      log(`beginning delete ops`)

      const numSessionTokensDeleted = await models.SessionToken.destroy({
        where: { id: ids },
        transaction
      })
      log(`numSessionTokensDeleted ${numSessionTokensDeleted}`)
    } catch (e) {
      error = e
    } finally {
      // Rollback transaction on error
      if (error) {
        await transaction.rollback()
        log(`rolling back transaction due to error ${error}`)
      } else if (!externalTransaction) {
        // Commit transaction if no error and no external transaction provided
        await transaction.commit()
        log(`commited internal transaction`)
      }

      log(`completed in ${Date.now() - start}ms`)
    }
  }
}

/**
 * returns string literal `select "clock" from "CNodeUsers" where "cnodeUserUUID" = '${cnodeUserUUID}'`
 * @dev source: https://stackoverflow.com/questions/36164694/sequelize-subquery-in-where-clause
 */
function _getSelectCNodeUserClockSubqueryLiteral (cnodeUserUUID) {
  const subquery = sequelize.dialect.QueryGenerator.selectQuery('CNodeUsers', {
    attributes: ['clock'],
    where: { cnodeUserUUID }
  }).slice(0, -1) // removes trailing ';'
  return sequelize.literal(`(${subquery})`)
}

module.exports = DBManager
