const models = require('./models')
const sequelize = models.sequelize

// TODO - consider moving to inside /src/models
// TODO - turn into class

// TODO consider adding hook to ensure write op can never set clockVal to anything <= current

// TODO - any further constraint enforcement needed?
// - DataTables all FK to Clocks table
//     - Clocks table has unique constraint
//     - dataTables have unique C on (userId + clock)

// source: https://stackoverflow.com/questions/36164694/sequelize-subquery-in-where-clause
const _getSelectCNodeUserClockSubqueryLiteral = (cnodeUserUUID) => {
  const subquery = sequelize.dialect.QueryGenerator.selectQuery('CNodeUsers', {
    attributes: ['clock'],
    where: { cnodeUserUUID }
  }).slice(0, -1) // removes trailing ';'
  return sequelize.literal(`(${subquery})`)
}

const createNewFileRecord = async (queryObj, cnodeUserUUID, transaction) => {
  // Increment CNodeUser.clock value by 1
  await models.CNodeUser.increment(
    'clock', /* fields */
    {
      where: { cnodeUserUUID },
      by: 1,
      transaction
    }
  )

  // Add row in ClockRecords table using clock value from CNodeUser
  await models.ClockRecord.create({
    cnodeUserUUID,
    clock: _getSelectCNodeUserClockSubqueryLiteral(cnodeUserUUID),
    sourceTable: 'File'
  }, { transaction })

  // Add row in Files table with queryObj
  queryObj.clock = _getSelectCNodeUserClockSubqueryLiteral(cnodeUserUUID)
  queryObj.cnodeUserUUID = cnodeUserUUID
  const file = await models.File.create(queryObj, { transaction })

  return file.dataValues
}

module.exports = {
  createNewFileRecord
}
