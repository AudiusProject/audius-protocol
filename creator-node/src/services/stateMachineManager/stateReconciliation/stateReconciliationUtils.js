const { logger } = require('../../../logging')
const { SyncType, JOB_NAMES } = require('../stateMachineConstants')
const QueueInterfacer = require('../QueueInterfacer')
const SyncRequestDeDuplicator = require('./SyncRequestDeDuplicator')

/**
 * Enqueues a sync request to secondary on specified syncQueue and returns job info
 */
const enqueueSyncRequest = async ({
  userWallet,
  primaryEndpoint,
  secondaryEndpoint,
  syncType,
  immediate = false
}) => {
  // If duplicate sync already exists, do not add and instead return existing sync job info
  const duplicateSyncJobInfo = SyncRequestDeDuplicator.getDuplicateSyncJobInfo(
    syncType,
    userWallet,
    secondaryEndpoint
  )
  if (duplicateSyncJobInfo) {
    logger.info(
      `enqueueSyncRequest() Failure - a sync of type ${syncType} is already waiting for user wallet ${userWallet} against secondary ${secondaryEndpoint}`
    )

    return duplicateSyncJobInfo
  }

  // Define axios params for sync request to secondary
  const syncRequestParameters = {
    baseURL: secondaryEndpoint,
    url: '/sync',
    method: 'post',
    data: {
      wallet: [userWallet],
      creator_node_endpoint: primaryEndpoint,
      // Note - `sync_type` param is only used for logging by nodeSync.js
      sync_type: syncType,
      // immediate = true will ensure secondary skips debounce and evaluates sync immediately
      immediate
    }
  }

  // Add job to issue manual or recurring sync request based on `syncType` param
  const jobName =
    syncType === SyncType.Manual
      ? JOB_NAMES.ISSUE_MANUAL_SYNC_REQUEST
      : JOB_NAMES.ISSUE_RECURRING_SYNC_REQUEST
  const jobProps = {
    syncType,
    syncRequestParameters
    // addStateReconciliationJob: addJobToQueueFunc
  }

  const startTimeMs = Date.now()
  const jobInfo = await QueueInterfacer.addStateReconciliationJob(
    jobName,
    jobProps
  )
  const timeElapsedMs = Date.now() - startTimeMs
  logger.info(
    `enqueueSync waited ${timeElapsedMs}ms for sync type ${syncType} Bull job to be added to queue for user wallet ${userWallet}`
  )

  // Record sync in syncDeDuplicator
  SyncRequestDeDuplicator.recordSync(
    syncType,
    userWallet,
    secondaryEndpoint,
    jobInfo
  )

  return jobInfo
}

module.exports = {
  enqueueSyncRequest
}
