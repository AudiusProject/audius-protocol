const config = require('../../../config')
const { SyncType } = require('../stateMachineConstants')
const { enqueueSyncRequest } = require('./stateReconciliationUtils')

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')

/**
 * Enqueues requests to later be issued to sync every given user's data
 * from their primary (this node) to one or more of ther their secondaries if needed.
 * Only enqueues requests if primary clock value is greater than secondary clock value.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {Object[]} params.potentialSyncRequests array of objects of schema { user_id, wallet, primary, secondary1, secondary2, endpoint } where `endpoint` is the secondary to issue a request to
 * @param {Object} param.replicaSetNodesToUserClockStatusesMap map(replica set node => map(userWallet => clockValue))
 */
module.exports = async function ({
  logger,
  potentialSyncRequests,
  replicaSetNodesToUserClockStatusesMap
}) {
  _validateJobData(
    logger,
    potentialSyncRequests,
    replicaSetNodesToUserClockStatusesMap
  )

  const results = await Promise.all(
    potentialSyncRequests.map((potentialSyncRequest) =>
      _enqueuePotentialSyncRequest(
        potentialSyncRequest,
        replicaSetNodesToUserClockStatusesMap,
        logger
      )
    )
  )

  const syncsEnqueued = []
  const errors = []
  for (const result of results) {
    const { syncEnqueued, error } = result
    if (error) errors.push(error)
    else if (syncEnqueued) syncsEnqueued.push(syncEnqueued)
  }

  return {
    syncsEnqueued,
    errors
  }
}

const _validateJobData = (
  logger,
  potentialSyncRequests,
  replicaSetNodesToUserClockStatusesMap
) => {
  if (typeof logger !== 'object') {
    throw new Error(
      `Invalid type ("${typeof logger}") or value ("${logger}") of logger param`
    )
  }
  if (!(potentialSyncRequests instanceof Array)) {
    throw new Error(
      `Invalid type ("${typeof potentialSyncRequests}") or value ("${potentialSyncRequests}") of potentialSyncRequests param`
    )
  }
  if (
    typeof replicaSetNodesToUserClockStatusesMap !== 'object' ||
    replicaSetNodesToUserClockStatusesMap instanceof Array
  ) {
    throw new Error(
      `Invalid type ("${typeof replicaSetNodesToUserClockStatusesMap}") or value ("${replicaSetNodesToUserClockStatusesMap}") of replicaSetNodesToUserClockStatusesMap`
    )
  }
}

const _enqueuePotentialSyncRequest = async (
  potentialSyncRequest,
  replicaSetNodesToUserClockStatusesMap,
  logger
) => {
  try {
    const {
      wallet,
      primary,
      secondary1,
      secondary2,
      endpoint: secondary
    } = potentialSyncRequest

    // Short-circuit if primary is not self - this function is meant to be called from primary to secondaries only
    if (primary !== thisContentNodeEndpoint) {
      logger.error(
        `_enqueuePotentialSyncRequest() can only be called by user's primary. User ${wallet} - replicaset [${primary}, ${secondary1}, ${secondary2}].`
      )
      return
    }

    // Determine if secondary requires a sync by comparing clock values against primary (this node)
    const userPrimaryClockVal =
      replicaSetNodesToUserClockStatusesMap[primary][wallet]
    const userSecondaryClockVal =
      replicaSetNodesToUserClockStatusesMap[secondary][wallet]

    if (userPrimaryClockVal > userSecondaryClockVal) {
      const job = await enqueueSyncRequest({
        userWallet: wallet,
        secondaryEndpoint: secondary,
        primaryEndpoint: thisContentNodeEndpoint,
        syncType: SyncType.Recurring
      })

      return {
        syncEnqueued: job
      }
    }
    return {}
  } catch (e) {
    return {
      error: `_enqueuePotentialSyncRequest() - Error for potentialSyncRequest ${JSON.stringify(
        potentialSyncRequest
      )} - ${e.message}`
    }
  }
}
