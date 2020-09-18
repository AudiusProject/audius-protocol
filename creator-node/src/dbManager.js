const models = require('./models')
const sequelize = models.sequelize

/**
TODO - consider moving to inside /src/models

TODO consider adding hook to ensure write op can never set clockVal to anything <= current

TODO - any further constraint enforcement needed?
- DataTables all FK to Clocks table
    - Clocks table has unique constraint
//     - dataTables have unique C on (userId + clock)
 */

class DBManager {
  /**
   * Given file insert query object and cnodeUserUUID, inserts new file record in DB
   *    and handles all required clock management.
   * Steps:
   *  1. increments cnodeUser clock value
   *  2. insert new ClockRecord entry with new clock value
   *  3. insert new File entry with queryObj and new clock value
   *
   * After initial increment, clock values are read as subquery without reading into JS to guarantee atomicity
   *
   * TODO - flesh out jsdoc
   * @param {*} queryObj - object with file insert data
   * @param {*} cnodeUserUUID
   * @param {*} transaction
   *
   * TODO - returns
   */
  static async createNewDataRecord (queryObj, cnodeUserUUID, sourceTable, transaction) {
    // Increment CNodeUser.clock value by 1
    await models.CNodeUser.increment('clock', {
      where: { cnodeUserUUID },
      by: 1,
      transaction
    })

    const selectCNodeUserClockSubqueryLiteral = _getSelectCNodeUserClockSubqueryLiteral(cnodeUserUUID)

    // Add row in ClockRecords table using clock value from CNodeUser
    await models.ClockRecord.create({
      cnodeUserUUID,
      clock: selectCNodeUserClockSubqueryLiteral,
      sourceTable
    }, { transaction })

    // Add cnodeUserUUID + clock value to queryObj
    queryObj.cnodeUserUUID = cnodeUserUUID
    queryObj.clock = selectCNodeUserClockSubqueryLiteral

    // Create new File entry with queryObj
    const modelsInstance = _getModelsInstance(sourceTable)
    const file = await modelsInstance.create(queryObj, { transaction })

    return file.dataValues
  }
}

const _SourceTableToModelInstanceMap = {
  'AudiusUser': models.AudiusUser,
  'Track': models.Track,
  'File': models.File
}

function _getModelsInstance (sourceTable) {
  return _SourceTableToModelInstanceMap[sourceTable]
}

/**
 * @dev source: https://stackoverflow.com/questions/36164694/sequelize-subquery-in-where-clause
 * @param {*} cnodeUserUUID
 */
function _getSelectCNodeUserClockSubqueryLiteral (cnodeUserUUID) {
  const subquery = sequelize.dialect.QueryGenerator.selectQuery('CNodeUsers', {
    attributes: ['clock'],
    where: { cnodeUserUUID }
  }).slice(0, -1) // removes trailing ';'
  return sequelize.literal(`(${subquery})`)
}

module.exports = DBManager
