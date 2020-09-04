const models = require('../models')

// TODO consider adding hook to ensure write op can never set clockVal to anything <= current
const incrementAndFetchCNodeUserClock = async (req, incrementBy = 1) => {
  const transaction = await models.sequelize.transaction()

  try {
    const cnodeUser = await models.CNodeUser.findOne({
      where: { cnodeUserUUID: req.session.cnodeUserUUID },
      transaction,
      /** TODO add comment */
      lock: transaction.LOCK.UPDATE
    })

    const newClockVal = (cnodeUser.clock + incrementBy)

    await cnodeUser.update(
      { clock: newClockVal },
      { transaction }
    )

    await transaction.commit()
    return newClockVal
  } catch (e) {
    await transaction.rollback()
    throw new Error('Failed to increment cnodeUser.clock')
  }
}

module.exports = {
  incrementAndFetchCNodeUserClock
}
