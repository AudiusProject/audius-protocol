const { QUEUE_NAMES } = require('../stateMachineConstants')
const models = require('../../../models')

/**
 * Processes a job to find and return reconfigurations of replica sets that
 * need to occur for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger a logger that can be filtered by jobName and jobId
 */
module.exports = async function ({ logger }) {
  _validateJobData({ logger })
  const inconsistentUsers = _findInconsistentClock({
    logger
  })

  return {
    jobsToEnqueue: inconsistentUsers?.length
      ? {
          [QUEUE_NAMES.FIX_INCONSISTENT_CLOCK]: inconsistentUsers
        }
      : {}
  }
}

const _validateJobData = ({ logger }) => {
  if (typeof logger !== 'object') {
    throw new Error(
      `Invalid type ("${typeof logger}") or value ("${logger}") of logger param`
    )
  }
}

const _findInconsistentClock = async ({ logger }) => {
  try {
    const inconsistentUsersReq = models.sequelize.query(`
    SELECT cnodeUserUUID
    FROM (
        SELECT cnodeUserUUID, MAX(clock) as max_clock
        FROM ClockRecords
        GROUP BY cnodeUserUUID;
    ) AS subquery
    WHERE CNodeUsers.cnodeUserUUID = subquery.cnodeUserUUID
    AND CNodeUsers.clock < subquery.max_clock;
  `)

    const inconsistentUsers = inconsistentUsersReq.map(
      ({ cnodeUserUUID }) => cnodeUserUUID
    )

    return inconsistentUsers
  } catch (e) {
    logger.error(
      `_findInconsistentClock: error finding inconsistent clock values - ${e.message}`
    )
  }
}
