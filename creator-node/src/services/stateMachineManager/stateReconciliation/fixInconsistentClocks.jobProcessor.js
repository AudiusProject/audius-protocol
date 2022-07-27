const models = require('../../../models')

/**
 * Processes a job to find and return reconfigurations of replica sets that
 * need to occur for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger a logger that can be filtered by jobName and jobId
 */
module.exports = async function ({ logger, userId }) {
  _validateJobData({ logger, userId })
  _fixInconsistentClock({ logger, userId })
}

const _validateJobData = ({ logger, userId }) => {
  if (typeof logger !== 'object') {
    throw new Error(
      `Invalid type ("${typeof logger}") or value ("${logger}") of logger param`
    )
  }

  if (typeof userId !== 'string') {
    throw new Error(
      `Invalid type ("${typeof userId}") or value ("${userId}") of userId param`
    )
  }
}

const _fixInconsistentClock = async ({ logger, userId }) => {
  try {
    models.sequelize.query(`
        UPDATE cnodeUsers
        SET clock = subquery.max_clock
        FROM (
            SELECT cnodeUserUUID, MAX(clock) AS max_clock
            FROM ClockRecords
            WHERE cnodeUserUUID = :userId
            GROUP BY cnodeUserUUID;
        ) AS subquery
        WHERE cnodeUserUUID = :userId
        AND subquery.cnodeUserUUID = :userId;
    `)
  } catch (e) {
    logger.error(
      `_fixInconsistentClock: error fixing an inconsistent clock on users ${userId} - ${e.message}`
    )
  }
}
