const _ = require('lodash')
const axios = require('axios')
const { logger } = require('../../../logging')
const Utils = require('../../../utils')
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
  immediate = false
}) => {
  // If duplicate sync already exists, do not add and instead return existing sync job info
  const duplicateSyncJobInfo = SyncRequestDeDuplicator.getDuplicateSyncJobInfo(
    syncType,
    userWallet,
    secondaryEndpoint
  )
  if (duplicateSyncJobInfo && syncType !== SyncType.Manual) {
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

/**
 * Issues syncRequest for user against secondary, and polls for replication up to primary
 * If secondary fails to sync within specified timeoutMs, will error
 */
const issueSyncRequestsUntilSynced = async (
  primaryUrl,
  secondaryUrl,
  wallet,
  primaryClockVal,
  timeoutMs,
  queue
) => {
  // Issue syncRequest before polling secondary for replication
  const { duplicateSyncReq, syncReqToEnqueue } = getNewOrExistingSyncReq({
    userWallet: wallet,
    secondaryEndpoint: secondaryUrl,
    primaryEndpoint: primaryUrl,
    syncType: SyncType.Manual,
    immediate: true
  })
  if (!_.isEmpty(duplicateSyncReq)) {
    // Log duplicate and return
    logger.info(`issueSyncRequestsUntilSynced: Duplicate sync request: ${JSON.stringify(duplicateSyncReq)}`)
    return
  } else if (!_.isEmpty(syncReqToEnqueue)) {
    const { jobName, jobData } = syncReqToEnqueue
    logger.info(`issueSyncRequestsUntilSynced: jobData: ${JSON.stringify(jobData)}`)
    await queue.add(jobName, jobData)
  } else {
    // Log error that the sync request couldn't be created and return
    logger.error(`issueSyncRequestsUntilSynced: Failed to create manual sync request ${{ userWallet, secondaryUrl, primaryUrl }}`)
    return
  }

  // Poll clock status and issue syncRequests until secondary is caught up or until timeoutMs
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      // Retrieve secondary clock status for user
      const secondaryClockStatusResp = await axios({
        method: 'get',
        baseURL: secondaryUrl,
        url: `/users/clock_status/${wallet}`,
        responseType: 'json',
        timeout: 1000 // 1000ms = 1s
      })
      const { clockValue: secondaryClockVal, syncInProgress } =
        secondaryClockStatusResp.data.data
      logger.info(`issueSyncRequestsUntilSynced: clock value from ${secondaryUrl}: ${secondaryClockVal}, primaryCLockValue: ${primaryClockVal}`)
      // If secondary is synced, return successfully
      if (secondaryClockVal >= primaryClockVal) {
        return

        // Else, if a sync is not already in progress on the secondary, issue a new SyncRequest
      } else if (!syncInProgress) {
        const { duplicateSyncReq, syncReqToEnqueue } = getNewOrExistingSyncReq({
          userWallet: wallet,
          secondaryEndpoint: secondaryUrl,
          primaryEndpoint: primaryUrl,
          syncType: SyncType.Manual
        })
        if (!_.isEmpty(duplicateSyncReq)) {
          // Log duplicate and return
          logger.warn(`Duplicate sync request: ${duplicateSyncReq}`)
          return
        } else if (!_.isEmpty(syncReqToEnqueue)) {
          const { jobName, jobData } = syncReqToEnqueue
          await queue.add(jobName, jobData)
        } else {
          // Log error that the sync request couldn't be created and return
          logger.error(
            `Failed to create manual sync request: ${duplicateSyncReq}`
          )
          return
        }
      }

      // Give secondary some time to process ongoing or newly enqueued sync
      // NOTE - we might want to make this timeout longer
      await Utils.timeout(500)
    } catch (e) {
      // do nothing and let while loop continue
    }
  }

  // This condition will only be hit if the secondary has failed to sync within timeoutMs
  throw new Error(
    `Secondary ${secondaryUrl} did not sync up to primary for user ${wallet} within ${timeoutMs}ms`
  )
}

module.exports = {
  getNewOrExistingSyncReq,
  issueSyncRequestsUntilSynced
}
