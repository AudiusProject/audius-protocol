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
   * @dev TODO add unit test
   *
   * @param {*} CNodeUserLookupObj
   * @param {*} sequelizeTableInstance
   * @param {*} tx
   */
  static async deleteAllCNodeUserDataFromDB ({ lookupCnodeUserUUID, lookupWallet }, externalTransaction) {
    const transaction = (externalTransaction) || (await models.sequelize.transaction())
    const log = (msg) => logger.info(`DBManager log: ${msg}`)

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
      log(`deleteAllCNodeUserDataFromDB || cnodeUserUUID: ${cnodeUserUUID} || beginning delete ops`)

      const numAudiusUsersDeleted = await models.AudiusUser.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`deleteAllCNodeUserDataFromDB || cnodeUserUUID: ${cnodeUserUUID} || numAudiusUsersDeleted ${numAudiusUsersDeleted}`)

      // TrackFiles must be deleted before associated Tracks can be deleted
      const numTrackFilesDeleted = await models.File.destroy({
        where: {
          cnodeUserUUID,
          trackBlockchainId: { [models.Sequelize.Op.ne]: null } // Op.ne = notequal
        },
        transaction
      })
      log(`deleteAllCNodeUserDataFromDB || cnodeUserUUID: ${cnodeUserUUID} || numTrackFilesDeleted ${numTrackFilesDeleted}`)

      const numTracksDeleted = await models.Track.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`deleteAllCNodeUserDataFromDB || cnodeUserUUID: ${cnodeUserUUID} || numTracksDeleted ${numTracksDeleted}`)

      // Delete all remaining files (image / metadata files).
      const numNonTrackFilesDeleted = await models.File.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`deleteAllCNodeUserDataFromDB || cnodeUserUUID: ${cnodeUserUUID} || numNonTrackFilesDeleted ${numNonTrackFilesDeleted}`)

      const numClockRecordsDeleted = await models.ClockRecord.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`deleteAllCNodeUserDataFromDB || cnodeUserUUID: ${cnodeUserUUID} || numClockRecordsDeleted ${numClockRecordsDeleted}`)

      const numSessionTokensDeleted = await models.SessionToken.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(`deleteAllCNodeUserDataFromDB || cnodeUserUUID: ${cnodeUserUUID} || numSessionTokensDeleted ${numSessionTokensDeleted}`)

      // Delete cnodeUser entry
      await cnodeUser.destroy({ transaction })
      log(`deleteAllCNodeUserDataFromDB || cnodeUserUUID: ${cnodeUserUUID} || cnodeUser entry deleted`)
    } catch (e) {
      if (e.message !== 'No cnodeUser found') {
        error = e
      }
    } finally {
      // Rollback transaction on error for external or internal transaction
      // TODO - consider not rolling back in case of external transaction, and just throwing instead
      if (error) {
        await transaction.rollback()
        log(`deleteAllCNodeUserDataFromDB || rolling back transaction due to error ${error}`)
      } else if (!externalTransaction) {
        // Commit transaction if no error and no external transaction provided
        await transaction.commit()
        log(`deleteAllCNodeUserDataFromDB || commited internal transaction`)
      }

      log(`deleteAllCNodeUserDataFromDB || completed in ${Date.now() - start}ms`)
    }
  }

  /**
   * Deletes all session tokens matching an Array of session token IDs. 
   *
   *
   * @dev TODO add unit test
   *
   * @param {Array} ids
   * @param {*} tx
   */
  static async deleteSessionTokensFromDB (ids, externalTransaction) {
    const transaction = (externalTransaction) || (await models.sequelize.transaction())
    const log = (msg) => logger.info(`DBManager log: ${msg}`)

    const start = Date.now()
    let error
    try {
      log(`deleteSessionTokensFromDB || beginning delete ops`)

      const numSessionTokensDeleted = await models.SessionToken.destroy({
        id: ids,
        transaction
      })
      log(`deleteSessionTokensFromDB || numSessionTokensDeleted ${numSessionTokensDeleted}`)

    } finally {
      // Rollback transaction on error for external or internal transaction
      // TODO - consider not rolling back in case of external transaction, and just throwing instead
      if (error) {
        await transaction.rollback()
        log(`deleteSessionTokensFromDB || rolling back transaction due to error ${error}`)
      } else if (!externalTransaction) {
        // Commit transaction if no error and no external transaction provided
        await transaction.commit()
        log(`deleteSessionTokensFromDB || commited internal transaction`)
      }

      log(`deleteSessionTokensFromDB || completed in ${Date.now() - start}ms`)
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
