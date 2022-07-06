const { logger } = require('../../../logging')
const { SyncType, JOB_NAMES } = require('../stateMachineConstants')
const SyncRequestDeDuplicator = require('./SyncRequestDeDuplicator')

/**
 * Returns a job can be enqueued to add a sync request for the given user to the given secondary,
 * or returns the duplicate job if one already exists to for the same user and secondary.
 * @Returns {
 *   duplicateSyncReq,
 *   syncReqToEnqueue
 * }
 */
const getNewOrExistingSyncReq = ({
  userWallet,
  primaryEndpoint,
  secondaryEndpoint,
  syncType,
  syncMode,
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
      `getNewOrExistingSyncReq() Failure - a sync of type ${syncType} is already waiting for user wallet ${userWallet} against secondary ${secondaryEndpoint}`
    )

    return {
      duplicateSyncReq: duplicateSyncJobInfo
    }
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
  const jobData = {
    syncType,
    syncMode,
    syncRequestParameters
  }
  const syncReqToEnqueue = {
    jobName,
    jobData
  }

  // Record sync in syncDeDuplicator
  SyncRequestDeDuplicator.recordSync(
    syncType,
    userWallet,
    secondaryEndpoint,
    jobData
  )

  return { syncReqToEnqueue }
}

module.exports = {
  getNewOrExistingSyncReq
}
