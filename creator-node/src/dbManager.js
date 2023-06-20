const path = require('path')
const { isEmpty } = require('lodash')

const { logger } = require('./logging')
const models = require('./models')
const config = require('./config')
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
  static async createNewDataRecord(
    queryObj,
    cnodeUserUUID,
    sequelizeTableInstance,
    transaction
  ) {
    // Increment CNodeUser.clock value by 1
    await models.CNodeUser.increment('clock', {
      where: { cnodeUserUUID },
      by: 1,
      transaction
    })

    const selectCNodeUserClockSubqueryLiteral =
      _getSelectCNodeUserClockSubqueryLiteral(cnodeUserUUID)

    // Add row in ClockRecords table using new CNodeUser.clock
    await models.ClockRecord.create(
      {
        cnodeUserUUID,
        clock: selectCNodeUserClockSubqueryLiteral,
        sourceTable: sequelizeTableInstance.name
      },
      { transaction }
    )

    // Add cnodeUserUUID + clock value to queryObj
    queryObj.cnodeUserUUID = cnodeUserUUID
    queryObj.clock = selectCNodeUserClockSubqueryLiteral

    // Create new Data table entry with queryObj using new CNodeUser.clock
    const newDataRecord = await sequelizeTableInstance.create(queryObj, {
      transaction
    })

    return newDataRecord.dataValues
  }

  /**
   * Deletes all data for a cnodeUser from DB (every table, including CNodeUsers)
   *
   * @param {Object} CNodeUserLookupObj specifies either `lookupCNodeUserUUID` or `lookupWallet` properties
   */
  static async deleteAllCNodeUserDataFromDB({
    lookupCNodeUserUUID,
    lookupWallet
  }) {
    const transaction = await models.sequelize.transaction()
    const log = (msg) =>
      logger.info(`DBManager.deleteAllCNodeUserDataFromDB log: ${msg}`)

    const start = Date.now()
    let error
    try {
      const cnodeUserWhereFilter = lookupWallet
        ? { walletPublicKey: lookupWallet }
        : { cnodeUserUUID: lookupCNodeUserUUID }
      const cnodeUser = await models.CNodeUser.findOne({
        where: cnodeUserWhereFilter,
        transaction
      })

      // Throw if no cnodeUser found
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
      log(
        `${cnodeUserUUIDLog} || numAudiusUsersDeleted ${numAudiusUsersDeleted}`
      )

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
      log(
        `${cnodeUserUUIDLog} || numNonTrackFilesDeleted ${numNonTrackFilesDeleted}`
      )

      const numClockRecordsDeleted = await models.ClockRecord.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(
        `${cnodeUserUUIDLog} || numClockRecordsDeleted ${numClockRecordsDeleted}`
      )

      const numSessionTokensDeleted = await models.SessionToken.destroy({
        where: { cnodeUserUUID },
        transaction
      })
      log(
        `${cnodeUserUUIDLog} || numSessionTokensDeleted ${numSessionTokensDeleted}`
      )

      // Delete cnodeUser entry
      await cnodeUser.destroy({ transaction })
      log(`${cnodeUserUUIDLog} || cnodeUser entry deleted`)
    } catch (e) {
      // Swallow 'No cnodeUser found' error
      if (e.message !== 'No cnodeUser found') {
        error = e
      }
    } finally {
      // Rollback transaction on error for external or internal transaction
      // TODO - consider not rolling back in case of external transaction, and just throwing instead
      if (error) {
        await transaction.rollback()
        log(`rolling back transaction due to error ${error}`)
      } else {
        // Commit transaction if no error and no external transaction provided
        await transaction.commit()
        log(`commited internal transaction`)
      }

      log(`completed in ${Date.now() - start}ms`)
    }

    return error
  }

  /**
   * Gets a user's files that only they have (Files table storagePath column), with pagination.
   * Ignores any file that has 1 or more entries from another user.
   * @param {string} cnodeUserUUID the UUID of the user to fetch file paths for
   * @param {string} prevStoragePath pagination token (where storagePath > prevStoragePath)
   * @param {number} batchSize the pagination size (number of file paths to return)
   * @returns {string[]} user's storagePaths from db
   */
  static async getCNodeUserFilesFromDb(
    cnodeUserUUID,
    prevStoragePath,
    batchSize
  ) {
    // Get a batch of file that this user needs
    const userFiles = []
    const userFilesQueryResult = await models.File.findAll({
      attributes: ['storagePath'],
      where: {
        cnodeUserUUID,
        storagePath: {
          [sequelize.Op.gte]: prevStoragePath
        }
      },
      distinct: true,
      order: [['storagePath', 'ASC']],
      limit: batchSize
    })
    logger.debug(
      `userFilesQueryResult for ${cnodeUserUUID}: ${JSON.stringify(
        userFilesQueryResult || {}
      )}`
    )
    if (isEmpty(userFilesQueryResult)) return []
    for (const file of userFilesQueryResult) {
      userFiles.push(path.normalize(file.storagePath))
    }

    // Get all files that: 1. could match a file in the above batch; and 2. are only needed by 1 user
    const allUniqueFiles = []
    const allUniqueFilesQueryResult = await models.File.findAll({
      attributes: ['storagePath'],
      where: {
        storagePath: {
          [sequelize.Op.between]: [
            userFiles[0],
            userFiles[userFiles.length - 1]
          ]
        }
      },
      group: 'storagePath',
      having: sequelize.literal(`COUNT(DISTINCT("cnodeUserUUID")) = 1`)
    })
    logger.debug(
      `allUniqueFilesQueryResult for ${cnodeUserUUID}: ${JSON.stringify(
        allUniqueFilesQueryResult || {}
      )}`
    )
    if (isEmpty(allUniqueFilesQueryResult)) return []
    for (const file of allUniqueFilesQueryResult) {
      allUniqueFiles.push(path.normalize(file.storagePath))
    }

    // Return files that only this user needs (files that aren't associated with anyone else)
    const userUniqueFiles = allUniqueFiles.filter((file) =>
      userFiles.includes(file)
    )
    logger.debug(`userUniqueFiles for ${cnodeUserUUID}: ${userUniqueFiles}`)
    return userUniqueFiles
  }

  /**
   * Deletes all session tokens matching an Array of SessionTokens.
   *
   * @param {Array} sessionTokens from the SessionTokens table
   * @param {Transaction=} externalTransaction
   */
  static async deleteSessionTokensFromDB(sessionTokens, externalTransaction) {
    const transaction =
      externalTransaction || (await models.sequelize.transaction())
    const log = (msg) =>
      logger.info(`DBManager.deleteSessionTokensFromDB || log: ${msg}`)
    const ids = sessionTokens.map((st) => st.id)
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

  /**
   * Computes and returns filesHash for user, optionally by clock range
   * filesHash = md5 hash of all user's File multihashes, ordered by clock asc
   *
   * @param {Object} lookupKey lookup user by either cnodeUserUUID or walletPublicKey
   * @param {Number?} clockMin if provided, consider only Files with clock >= clockMin (inclusive)
   * @param {Number?} clockMax if provided, consider only Files with clock < clockMax (exclusive)
   * @returns {string|null} filesHash
   */
  static async fetchFilesHashFromDB({
    lookupKey: { lookupCNodeUserUUID, lookupWallet },
    clockMin = null,
    clockMax = null
  }) {
    let query = `
      select
        md5(string_agg("multihash", ',' order by "clock" asc))
      from "Files"
    `

    if (lookupCNodeUserUUID) {
      query += ' where "cnodeUserUUID" = :lookupCNodeUserUUID'
    } else if (lookupWallet) {
      query +=
        ' where "cnodeUserUUID" = (select "cnodeUserUUID" from "CNodeUsers" where "walletPublicKey" = :lookupWallet)'
    } else {
      throw new Error('Error: Must provide lookupCNodeUserUUID or lookupWallet')
    }

    if (clockMin) {
      clockMin = parseInt(clockMin)
      // inclusive
      query += ` and "clock" >= :clockMin`
    }
    if (clockMax) {
      clockMax = parseInt(clockMax)
      // exclusive
      query += ` and "clock" < :clockMax`
    }

    try {
      const filesHashResp = await sequelize.query(query, {
        replacements: {
          lookupWallet,
          lookupCNodeUserUUID,
          clockMin,
          clockMax
        }
      })

      const filesHash = filesHashResp[0][0].md5
      return filesHash
    } catch (e) {
      throw new Error(`[fetchFilesHashFromDB] ${e.message}`)
    }
  }

  /**
   * Computes and returns filesHashes for all users
   * filesHash will be null if user not found or if no files exist for user
   * filesHash = md5 hash of all user's File multihashes, ordered by clock asc
   *
   * Similar to fetchFilesHashFromDB() above, but for multiple users
   * Makes single DB query to compute filesHash for all users
   *
   * @param {Array<string>} cnodeUserUUIDs cnodeUserUUID array
   * @returns {Object} filesHashesByUUIDMap = map(cnodeUserUUID<string> => filesHash<string>)
   */
  static async fetchFilesHashesFromDB({ cnodeUserUUIDs }) {
    try {
      // Initialize filesHashesByUUIDMap with null values
      const filesHashesByUUIDMap = {}
      cnodeUserUUIDs.forEach((cnodeUserUUID) => {
        filesHashesByUUIDMap[cnodeUserUUID] = null
      })
      if (cnodeUserUUIDs.length === 0) {
        return filesHashesByUUIDMap
      }

      const query = `
        select
          "cnodeUserUUID",
          md5(string_agg("multihash", ',' order by "clock" asc)) as "filesHash"
        from (
          select "cnodeUserUUID", "multihash", "clock"
          from "Files"
          where "cnodeUserUUID" in (:cnodeUserUUIDs)
        ) as subquery
        group by "cnodeUserUUID"
      `
      // Returns [{ cnodeUserUUID, filesHash }]
      const queryResp = await sequelize.query(query, {
        replacements: { cnodeUserUUIDs }
      })

      // Populate filesHashesByUUIDMap
      queryResp[0].forEach((resp) => {
        filesHashesByUUIDMap[resp.cnodeUserUUID] = resp.filesHash
      })

      return filesHashesByUUIDMap
    } catch (e) {
      throw new Error(`[fetchFilesHashesFromDB] ${e.message}`)
    }
  }

  /**
   * Given a user's UUID, this function will set their clock value equal to the max clock value
   * found in the ClockRecords table for that same user
   *
   * @param cnodeUserUUID the UUID for the user whose clock needs to be made consistent
   */
  static async fixInconsistentUser(cnodeUserUUID) {
    const [, metadata] = await sequelize.query(
      `
    UPDATE "CNodeUsers" as cnodeusers
    SET clock = subquery.max_clock
    FROM (
        SELECT "cnodeUserUUID", MAX(clock) AS max_clock
        FROM "ClockRecords"
        WHERE "cnodeUserUUID" = :cnodeUserUUID
        GROUP BY "cnodeUserUUID"
    ) AS subquery
    WHERE cnodeusers."cnodeUserUUID" = subquery."cnodeUserUUID"
    `,
      {
        replacements: { cnodeUserUUID }
      }
    )

    const numRowsUpdated = metadata?.rowCount || 0
    return numRowsUpdated
  }

  static async _getLegacyStoragePathRecords(minCid, maxCid, batchSize, dir) {
    const dirQuery = `
      SELECT "storagePath", "multihash", "dirMultihash", "fileName", "trackBlockchainId", "fileUUID", "skipped" FROM
        (SELECT * FROM "Files" AS "Page"
          WHERE "multihash" BETWEEN :minCid AND :maxCid AND "type" = 'dir'
          ORDER BY "multihash" DESC)
      AS "LegacyResults"
      WHERE "storagePath" NOT LIKE '/file_storage/files/%' AND "storagePath" LIKE '/file_storage/%'
      LIMIT :batchSize
      `
    const nonDirQuery = `
      SELECT "storagePath", "multihash", "dirMultihash", "fileName", "trackBlockchainId", "fileUUID", "skipped" FROM
        (SELECT * FROM "Files" AS "Page"
          WHERE "multihash" BETWEEN :minCid AND :maxCid AND "type" != 'dir'
          ORDER BY "multihash" DESC)
      AS "LegacyResults"
      WHERE "storagePath" NOT LIKE '/file_storage/files/%' AND "storagePath" LIKE '/file_storage/%'
      LIMIT :batchSize
      `
    // Returns [[{ storagePath, multihash, skipped }]]
    const queryResult = await sequelize.query(dir ? dirQuery : nonDirQuery, {
      replacements: { minCid, maxCid, batchSize }
    })
    const fileRecords = queryResult[0]
    logger.debug(
      `fileRecords for legacy storagePaths (dir=${dir}) with CID in range [${minCid}, ${maxCid}]: ${JSON.stringify(
        fileRecords
      )}`
    )
    return fileRecords
  }

  static async getNonDirLegacyStoragePathRecords(minCid, maxCid, batchSize) {
    return DBManager._getLegacyStoragePathRecords(
      minCid,
      maxCid,
      batchSize,
      false
    )
  }

  static async getDirLegacyStoragePathRecords(minCid, maxCid, batchSize) {
    return DBManager._getLegacyStoragePathRecords(
      minCid,
      maxCid,
      batchSize,
      true
    )
  }

  static async getCustomStoragePathsRecords(minCid, maxCid, batchSize) {
    const query = `
      SELECT "storagePath", "multihash", "dirMultihash", "fileName", "trackBlockchainId", "fileUUID", "skipped" FROM
        (SELECT * FROM "Files" AS "Page"
          WHERE "multihash" BETWEEN :minCid AND :maxCid
          ORDER BY "multihash" DESC)
      AS "CustomResults"
      WHERE "storagePath" NOT LIKE :standardStoragePath AND "storagePath" NOT LIKE '/file_storage/%'
      LIMIT :batchSize
      `
    // Returns [[{ storagePath, multihash, dirMultihash, fileName, trackBlockchainId, fileUUID, skipped }]]
    const queryResult = await sequelize.query(query, {
      replacements: {
        minCid,
        maxCid,
        batchSize,
        standardStoragePath: `${config.get('storagePath')}/%`
      }
    })
    const fileRecords = queryResult[0]
    logger.debug(
      `fileRecords for custom storagePaths with CID in range [${minCid}, ${maxCid}]: ${JSON.stringify(
        fileRecords
      )}`
    )
    return fileRecords
  }

  static async updateLegacyPathDbRows(copiedFilePaths, logger) {
    if (!copiedFilePaths?.length) return true
    const transaction = await models.sequelize.transaction()
    try {
      for (const { legacyPath, nonLegacyPath } of copiedFilePaths) {
        await models.File.update(
          { storagePath: nonLegacyPath },
          { where: { storagePath: legacyPath } },
          { transaction }
        )
      }
      await transaction.commit()
      return true
    } catch (e) {
      logger.error(`Error updating legacy path db rows: ${e}`)
      await transaction.rollback()
    }
    return false
  }

  static async getNumLegacyStoragePathsRecords() {
    const query = `SELECT COUNT(*) FROM "Files" WHERE "storagePath" NOT LIKE '/file_storage/files/%' AND "storagePath" LIKE '/file_storage/%';`
    // Returns [[{ count }]]
    const queryResult = await sequelize.query(query)
    return parseInt(queryResult[0][0].count, 10)
  }

  static async getNumCustomStoragePathsRecords() {
    const query = `SELECT COUNT(*) FROM "Files" WHERE "storagePath" NOT LIKE '/file_storage/%';`
    // Returns [[{ count }]]
    const queryResult = await sequelize.query(query)
    return parseInt(queryResult[0][0].count, 10)
  }
}

/**
 * returns string literal `select "clock" from "CNodeUsers" where "cnodeUserUUID" = '${cnodeUserUUID}'`
 * @dev source: https://stackoverflow.com/questions/36164694/sequelize-subquery-in-where-clause
 */
function _getSelectCNodeUserClockSubqueryLiteral(cnodeUserUUID) {
  const subquery = sequelize.dialect.QueryGenerator.selectQuery('CNodeUsers', {
    attributes: ['clock'],
    where: { cnodeUserUUID }
  }).slice(0, -1) // removes trailing ';'
  return sequelize.literal(`(${subquery})`)
}

module.exports = DBManager
