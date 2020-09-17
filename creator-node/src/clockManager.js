const models = require('./models')
const sequelize = models.sequelize

// TODO consider adding hook to ensure write op can never set clockVal to anything <= current

// TODO - any further constraint enforcement needed?
// - DataTables all FK to Clocks table
//     - Clocks table has unique constraint
//     - dataTables have unique C on (userId + clock)

const updateClockInCNodeUserAndClockRecords = async (req, sourceTable, transaction) => {
  const cnodeUserUUID = req.session.cnodeUserUUID

  // Increment CNodeUser.clock value by 1
  await models.CNodeUser.increment(
    'clock', /* fields */
    {
      where: { cnodeUserUUID: req.session.cnodeUserUUID },
      by: 1,
      transaction
    }
  )

  // Add row in ClockRecords table using clock value from CNodeUser
  await models.ClockRecord.create({
    cnodeUserUUID: req.session.cnodeUserUUID,
    clock: sequelize.literal(`(${selectCNodeUserClockSubquery(cnodeUserUUID)})`),
    sourceTable
  }, { transaction })
}

// source: https://stackoverflow.com/questions/36164694/sequelize-subquery-in-where-clause
const selectCNodeUserClockSubquery = (cnodeUserUUID) => {
  return sequelize.dialect.QueryGenerator.selectQuery('CNodeUsers', {
    attributes: ['clock'],
    where: { cnodeUserUUID }
  }).slice(0, -1) // removes trailing ';'
}

module.exports = {
  updateClockInCNodeUserAndClockRecords,
  selectCNodeUserClockSubquery
}
