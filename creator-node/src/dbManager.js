const models = require('./models')
const sequelize = models.sequelize

/**
 * TODO - add  DataTables all composite FK to Clocks table
 * - https://stackoverflow.com/questions/9984022/postgres-fk-referencing-composite-pk
 */

class DBManager {
  /**
   * Given file insert query object and cnodeUserUUID, inserts new file record in DB
   *    and handles all required clock management.
   * Steps:
   *  1. increments cnodeUser clock value
   *  2. insert new ClockRecord entry with new clock value
   *  3. insert new Data Table (File, Track, AudiusUser) entry with queryObj and new clock value
   *
   * After initial increment, clock values are read as subquery without reading into JS to guarantee atomicity
   * 
   * * TODO - flesh out jsdoc
   * @param {*} queryObj 
   * @param {*} cnodeUserUUID 
   * @param {*} sequelizeTableInstance 
   * @param {*} transaction 
   * 
   * TODO - returns
   */
  static async createNewDataRecord (queryObj, cnodeUserUUID, sequelizeTableInstance, transaction) {
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
      sourceTable: sequelizeTableInstance.name
    }, { transaction })

    // Add cnodeUserUUID + clock value to queryObj
    queryObj.cnodeUserUUID = cnodeUserUUID
    queryObj.clock = selectCNodeUserClockSubqueryLiteral

    // Create new Data table entry with queryObj
    const file = await sequelizeTableInstance.create(queryObj, { transaction })

    return file.dataValues
  }
}

/**
 * @dev source: https://stackoverflow.com/questions/36164694/sequelize-subquery-in-where-clause
 * @param {*} cnodeUserUUID
 * return string "select * from clock where cnodeuseruuid"
 */
function _getSelectCNodeUserClockSubqueryLiteral (cnodeUserUUID) {
  const subquery = sequelize.dialect.QueryGenerator.selectQuery('CNodeUsers', {
    attributes: ['clock'],
    where: { cnodeUserUUID }
  }).slice(0, -1) // removes trailing ';'
  return sequelize.literal(`(${subquery})`)
}

module.exports = DBManager
