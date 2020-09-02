const models = require('../models')

// TODO consider adding hook to ensure write op can never set clockVal to anything <= current
const incrementAndFetchCNodeUserClock = async (req, incrementBy = 1) => {
  req.logger.error(`SIDTEST - BEGINNING CNODE USER UPDATE OP`)

  let newClockVal
  const transaction = await models.sequelize.transaction()

  try {
    const cnodeUser = await models.CNodeUser.findOne({
      where: { cnodeUserUUID: req.session.cnodeUserUUID },
      transaction,
      lock: transaction.LOCK.UPDATE
    })
    newClockVal = cnodeUser.clock + incrementBy
    await cnodeUser.update(
      { clock: newClockVal },
      { transaction }
    )

    await transaction.commit()
    req.logger.error(`SIDTEST - COMPLETED CNODE USER UPDATE OP`)
  } catch (e) {
    await transaction.rollback()
    req.logger.error(`SIDTEST - FAILED CNODE USER UPDATE OP`)
    throw new Error('Failed to increment cnodeUser.clock')
  }

  return newClockVal
}

module.exports = {
    incrementAndFetchCNodeUserClock
}