import { Transaction } from "sequelize"

const { logger } = require('./logging')
const models = require('./models')

const sequelize: any = models.sequelize

type CNodeUserUUID = string

type QueryObj = {
  multihash: string,
  sourceFile: string,
  storagePath: string,
  type: string,
  cnodeUserUUID?: CNodeUserUUID,
  clock?: number
}

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
    queryObj: QueryObj,
    cnodeUserUUID: string,
    sequelizeTableInstance: any,
    transaction: Transaction
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
    const file = await sequelizeTableInstance.create(queryObj, { transaction })

    return file.dataValues
  }
}

/**
 * returns string literal `select "clock" from "CNodeUsers" where "cnodeUserUUID" = '${cnodeUserUUID}'`
 * @dev source: https://stackoverflow.com/questions/36164694/sequelize-subquery-in-where-clause
 */
function _getSelectCNodeUserClockSubqueryLiteral(cnodeUserUUID: CNodeUserUUID) {
  const subquery = sequelize.dialect.QueryGenerator.selectQuery('CNodeUsers', {
    attributes: ['clock'],
    where: { cnodeUserUUID }
  }).slice(0, -1) // removes trailing ';'
  return sequelize.literal(`(${subquery})`)
}

module.exports = DBManager
