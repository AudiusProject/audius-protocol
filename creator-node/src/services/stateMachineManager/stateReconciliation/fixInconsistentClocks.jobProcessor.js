const models = require('../../../models')

/**
 * Processes a job to find and return reconfigurations of replica sets that
 * need to occur for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger a logger that can be filtered by jobName and jobId
 */
module.exports = async function ({ logger, userId, newClockValue }) {
  _validateJobData({ logger, userId, newClockValue })
  _fixInconsistentClock({ logger, userId, newClockValue })
}

const _validateJobData = ({ logger, userId, newClockValue }) => {
  if (typeof logger !== 'object') {
    throw new Error(
      `Invalid type ("${typeof logger}") or value ("${logger}") of logger param`
    )
  }

  if (typeof userId !== 'string') {
    throw new Error(
      `Invalid type ("${typeof wallet}") or value ("${userId}") of wallet param`
    )
  }

  if (typeof newClockValue !== 'number') {
    throw new Error(
      `Invalid type ("${typeof wallet}") or value ("${newClockValue}") of wallet param`
    )
  }
}

const _fixInconsistentClock = async ({ logger, userId, newClockValue }) => {
  try {
    models.sequelize.query(`
        UPDATE cnodeUsers
        SET clock = :newClockValue
        WHERE cnodeUserUUID = :userId;
    `)
  } catch (e) {
    logger.error(
      `_fixInconsistentClock: error fixing an inconsistent clock on users ${userId} to ${newClockValue} - ${e.message}`
    )
  }
}
