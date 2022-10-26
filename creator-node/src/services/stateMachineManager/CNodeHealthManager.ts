import type { StateMonitoringUser } from './stateMonitoring/types'

import axios from 'axios'

import config from '../../config'
import { logger } from '../../logging'

const redis = require('../../redis')
const { hasEnoughStorageSpace } = require('../../fileManager')

const PEER_HEALTH_CHECK_REQUEST_TIMEOUT_MS = config.get(
  'peerHealthCheckRequestTimeout'
)
const MAX_FILE_DESCRIPTORS_ALLOCATED_PERCENTAGE =
  config.get('maxFileDescriptorsAllocatedPercentage') / 100
const MINIMUM_DAILY_SYNC_COUNT = config.get('minimumDailySyncCount')
const MINIMUM_ROLLING_SYNC_COUNT = config.get('minimumRollingSyncCount')
const MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE =
  config.get('minimumSuccessfulSyncCountPercentage') / 100
const MAX_STORAGE_USED_PERCENT = config.get('maxStorageUsedPercent')

// Max number of seconds a primary may be unhealthy for since the first time it was seen as unhealthy
const MAX_NUMBER_SECONDS_PRIMARY_REMAINS_UNHEALTHY = config.get(
  'maxNumberSecondsPrimaryRemainsUnhealthy'
)
// Max number of seconds a secondary may be unhealthy for since the first time it was seen as unhealthy
const MAX_NUMBER_SECONDS_SECONDARY_REMAINS_UNHEALTHY = config.get(
  'maxNumberSecondsSecondaryRemainsUnhealthy'
)
const REDIS_KEY_PREFIX_PRIMARY = 'earliestFailedHealthCheckPrimary:'
const REDIS_KEY_PREFIX_SECONDARY = 'earliestFailedHealthCheckSecondary:'

const CNodeHealthManager = {
  getUnhealthyPeers,
  isNodeHealthy,
  determinePeerHealth,
  isNodeHealthyOrInGracePeriod,
  getEarliestFailedHealthCheckTimestamp,
  setHealthCheckTimestampToNow,
  resetEarliestUnhealthyTimestamp,
  _queryVerboseHealthCheck,
  _computeContentNodePeerSet
}

/**
 * Performs a health check on the peer set
 * @param {Object[]} nodeUsers array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
 * @param {string} contentNodeEndpoint the IP address / URL of this Content Node
 * @param {boolean?} [performSimpleCheck=false] flag to dictate whether or not to check health check response to
 *  determine node health
 * @returns the unhealthy peers in a Set
 *
 * @note consider returning healthy set?
 * TODO - add retry logic to node requests
 */
async function getUnhealthyPeers(
  nodeUsers: StateMonitoringUser[],
  thisContentNodeEndpoint: string
): Promise<Set<string>> {
  // Compute content node peerset from nodeUsers (all nodes that are in a shared replica set with this node)
  const peerSet = CNodeHealthManager._computeContentNodePeerSet(
    nodeUsers,
    thisContentNodeEndpoint
  )

  /**
   * Determine health for every peer & build list of unhealthy peers
   * TODO: change from sequential to chunked parallel
   */
  const unhealthyPeers = new Set<string>()

  for await (const peer of peerSet) {
    const isHealthy = await CNodeHealthManager.isNodeHealthy(peer)
    if (!isHealthy) {
      unhealthyPeers.add(peer)
    }
  }

  return unhealthyPeers
}

async function isNodeHealthy(node: string) {
  try {
    const verboseHealthCheckResp =
      await CNodeHealthManager._queryVerboseHealthCheck(node)
    // if node returns healthy: false consider that unhealthy just like non-200 response
    const { healthy } = verboseHealthCheckResp
    if (!healthy) {
      throw new Error(`Node health check returned healthy: false`)
    }
    CNodeHealthManager.determinePeerHealth(verboseHealthCheckResp)
  } catch (e: any) {
    logger.error(`isNodeHealthy() peer=${node} is unhealthy: ${e.toString()}`)
    return false
  }

  return true
}

/**
 * Takes data off the verbose health check response and determines the peer heatlh
 * @param {Object} verboseHealthCheckResp verbose health check response
 *
 * TODO: consolidate CreatorNodeSelection + peer set health check calculation logic
 */
function determinePeerHealth(verboseHealthCheckResp: any) {
  // Check for sufficient minimum storage size
  const { storagePathSize, storagePathUsed } = verboseHealthCheckResp
  if (
    storagePathSize &&
    storagePathUsed &&
    !hasEnoughStorageSpace({
      storagePathSize,
      storagePathUsed,
      maxStorageUsedPercent: MAX_STORAGE_USED_PERCENT
    })
  ) {
    throw new Error(
      `Almost out of storage=${
        storagePathSize - storagePathUsed
      }bytes remaining out of ${storagePathSize}. Requires less than ${MAX_STORAGE_USED_PERCENT}% used`
    )
  }

  // Check for sufficient file descriptors space
  const { allocatedFileDescriptors, maxFileDescriptors } =
    verboseHealthCheckResp
  if (
    allocatedFileDescriptors &&
    maxFileDescriptors &&
    allocatedFileDescriptors / maxFileDescriptors >=
      MAX_FILE_DESCRIPTORS_ALLOCATED_PERCENTAGE
  ) {
    throw new Error(
      `Running low on file descriptors availability=${
        (allocatedFileDescriptors / maxFileDescriptors) * 100
      }% used. Max file descriptors allocated percentage allowed=${
        MAX_FILE_DESCRIPTORS_ALLOCATED_PERCENTAGE * 100
      }%`
    )
  }

  // Check historical sync data for current day
  const { dailySyncSuccessCount, dailySyncFailCount } = verboseHealthCheckResp
  if (
    dailySyncSuccessCount &&
    dailySyncFailCount &&
    dailySyncSuccessCount + dailySyncFailCount > MINIMUM_DAILY_SYNC_COUNT &&
    dailySyncSuccessCount / (dailySyncFailCount + dailySyncSuccessCount) <
      MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE
  ) {
    throw new Error(
      `Latest daily sync data shows that this node fails at a high rate of syncs. Successful syncs=${dailySyncSuccessCount} || Failed syncs=${dailySyncFailCount}. Minimum successful sync percentage=${
        MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE * 100
      }%`
    )
  }

  // Check historical sync data for rolling window 30 days
  const { thirtyDayRollingSyncSuccessCount, thirtyDayRollingSyncFailCount } =
    verboseHealthCheckResp
  if (
    thirtyDayRollingSyncSuccessCount &&
    thirtyDayRollingSyncFailCount &&
    thirtyDayRollingSyncSuccessCount + thirtyDayRollingSyncFailCount >
      MINIMUM_ROLLING_SYNC_COUNT &&
    thirtyDayRollingSyncSuccessCount /
      (thirtyDayRollingSyncFailCount + thirtyDayRollingSyncSuccessCount) <
      MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE
  ) {
    throw new Error(
      `Rolling sync data shows that this node fails at a high rate of syncs. Successful syncs=${thirtyDayRollingSyncSuccessCount} || Failed syncs=${thirtyDayRollingSyncFailCount}. Minimum successful sync percentage=${
        MINIMUM_SUCCESSFUL_SYNC_COUNT_PERCENTAGE * 100
      }%`
    )
  }
}

/**
 * @param node the endpoint to check for health
 * @param isPrimary whether or not the node is a primary (primaries have a longer grace period)
 * @return true if the node is either:
 * - healthy; or
 * - unhealthy but in a grace period (extra time where it can be unhealthy before being reconfiged)
 */
async function isNodeHealthyOrInGracePeriod(node: string, isPrimary: boolean) {
  const isHealthy = await CNodeHealthManager.isNodeHealthy(node)
  if (isHealthy) {
    // If a node ever becomes healthy again and was once marked as unhealthy, remove tracker
    await CNodeHealthManager.resetEarliestUnhealthyTimestamp(node, isPrimary)
    return true
  } else {
    const failedTimestamp =
      await CNodeHealthManager.getEarliestFailedHealthCheckTimestamp(
        node,
        isPrimary
      )

    if (failedTimestamp) {
      // Grace period ends X seconds after the first failed health check
      const gracePeriodEndDate = new Date(failedTimestamp)
      gracePeriodEndDate.setSeconds(
        failedTimestamp.getSeconds() +
          (isPrimary
            ? MAX_NUMBER_SECONDS_PRIMARY_REMAINS_UNHEALTHY
            : MAX_NUMBER_SECONDS_SECONDARY_REMAINS_UNHEALTHY)
      )

      const now = new Date()
      if (now >= gracePeriodEndDate) return false
    } else {
      await CNodeHealthManager.setHealthCheckTimestampToNow(node, isPrimary)
    }
    return true
  }
}

async function getEarliestFailedHealthCheckTimestamp(
  node: string,
  isPrimary: boolean
): Promise<Date | null> {
  const timestampString = await redis.get(
    `${
      isPrimary ? REDIS_KEY_PREFIX_PRIMARY : REDIS_KEY_PREFIX_SECONDARY
    }${node}`
  )
  return timestampString ? new Date(timestampString) : null
}

async function setHealthCheckTimestampToNow(node: string, isPrimary: boolean) {
  return redis.set(
    `${
      isPrimary ? REDIS_KEY_PREFIX_PRIMARY : REDIS_KEY_PREFIX_SECONDARY
    }${node}`,
    new Date()
  )
}

async function resetEarliestUnhealthyTimestamp(
  node: string,
  isPrimary: boolean
) {
  return redis.del(
    `${
      isPrimary ? REDIS_KEY_PREFIX_PRIMARY : REDIS_KEY_PREFIX_SECONDARY
    }${node}`
  )
}

/**
 * Returns /health_check/verbose response.
 * TODO: - consider moving this pure function to libs
 *
 * @param {string} endpoint the endpoint to query
 * @returns {Object} the /health_check/verbose response from the endpoint
 */
async function _queryVerboseHealthCheck(endpoint: string) {
  // Axios request will throw on timeout or non-200 response
  const resp = await axios({
    baseURL: endpoint,
    url: '/health_check/verbose',
    method: 'get',
    timeout: PEER_HEALTH_CHECK_REQUEST_TIMEOUT_MS,
    headers: {
      'User-Agent': `Axios - @audius/content-node - ${config.get(
        'creatorNodeEndpoint'
      )} - CNodeHealthManager#queryVerboseHealthCheck`
    }
  })

  return resp.data.data
}

/**
 * @param {StateMonitoringUser[]} nodeUserInfoList array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
 * @returns {Set<string>} Set of content node endpoint strings
 */
function _computeContentNodePeerSet(
  nodeUserInfoList: StateMonitoringUser[],
  thisContentNodeEndpoint: string
) {
  // Aggregate all nodes from user replica sets
  let peerList = nodeUserInfoList
    .map((userInfo) => userInfo.primary)
    .concat(nodeUserInfoList.map((userInfo) => userInfo.secondary1))
    .concat(nodeUserInfoList.map((userInfo) => userInfo.secondary2))

  peerList = peerList
    .filter(Boolean) // filter out false-y values to account for incomplete replica sets
    .filter((peer) => peer !== thisContentNodeEndpoint) // remove self from peerList

  const peerSet = new Set(peerList) // convert to Set to get uniques

  return peerSet
}

export { CNodeHealthManager }
