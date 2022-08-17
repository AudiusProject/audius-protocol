const axios = require('axios')

const config = require('../../config')
const { logger } = require('../../logging')
const { hasEnoughStorageSpace } = require('../../fileManager')

const PEER_HEALTH_CHECK_REQUEST_TIMEOUT_MS = config.get(
  'peerHealthCheckRequestTimeout'
)
const MINIMUM_MEMORY_AVAILABLE = config.get('minimumMemoryAvailable')
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

/**
 * Tracks and caches health of Content Nodes.
 * TODO: Add caching for secondaries similar to how primaries have a threshold of time to remain unhealthy for.
 */
class CNodeHealthManager {
  constructor() {
    /* We do not want to eagerly cycle off the primary when issuing reconfigs if necessary, as the primary may
      have data that the secondaries lack. This map is used to track the primary and the number of times it has
      failed a health check.

      Schema:
      {
        {string} endpoint - the endpoint of the primary: {number} number of times a primary failed a health check
      }
    */
    this.primaryToEarliestFailedHealthCheckTimestamp = {}
  }

  log(msg) {
    logger.info(`CNodeHealthManager: ${msg}`)
  }

  logError(msg) {
    logger.error(`CNodeHealthManager ERROR: ${msg}`)
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
  async getUnhealthyPeers(
    nodeUsers,
    thisContentNodeEndpoint,
    performSimpleCheck = false
  ) {
    // Compute content node peerset from nodeUsers (all nodes that are in a shared replica set with this node)
    const peerSet = this._computeContentNodePeerSet(
      nodeUsers,
      thisContentNodeEndpoint
    )

    /**
     * Determine health for every peer & build list of unhealthy peers
     * TODO: change from sequential to chunked parallel
     */
    const unhealthyPeers = new Set()

    for await (const peer of peerSet) {
      const isHealthy = await this.isNodeHealthy(peer, performSimpleCheck)
      if (!isHealthy) {
        unhealthyPeers.add(peer)
      }
    }

    return unhealthyPeers
  }

  async isNodeHealthy(peer, performSimpleCheck = false) {
    try {
      const verboseHealthCheckResp = await this.queryVerboseHealthCheck(peer)
      if (!performSimpleCheck) {
        this.determinePeerHealth(verboseHealthCheckResp)
      }
    } catch (e) {
      this.logError(
        `isNodeHealthy() peer=${peer} is unhealthy: ${e.toString()}`
      )
      return false
    }

    return true
  }

  /**
   * Returns /health_check/verbose response.
   * TODO: - consider moving this pure function to libs
   *
   * @param {string} endpoint the endpoint to query
   * @returns {Object} the /health_check/verbose response from the endpoint
   */
  async queryVerboseHealthCheck(endpoint) {
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
   * Takes data off the verbose health check response and determines the peer heatlh
   * @param {Object} verboseHealthCheckResp verbose health check response
   *
   * TODO: consolidate CreatorNodeSelection + peer set health check calculation logic
   */
  determinePeerHealth(verboseHealthCheckResp) {
    // Check for sufficient minimum storage size
    const { storagePathSize, storagePathUsed } = verboseHealthCheckResp
    if (
      storagePathSize &&
      storagePathUsed &&
      !hasEnoughStorageSpace(
        storagePathSize,
        storagePathUsed,
        MAX_STORAGE_USED_PERCENT
      )
    ) {
      throw new Error(
        `Almost out of storage=${
          storagePathSize - storagePathUsed
        }bytes remaining out of ${storagePathSize}. Requires less than ${MAX_STORAGE_USED_PERCENT}% used`
      )
    }

    // Check for sufficient memory space
    const { usedMemory, totalMemory } = verboseHealthCheckResp
    if (
      usedMemory &&
      totalMemory &&
      totalMemory - usedMemory <= MINIMUM_MEMORY_AVAILABLE
    ) {
      throw new Error(
        `Running low on memory=${
          totalMemory - usedMemory
        }bytes remaining. Minimum memory required=${MINIMUM_MEMORY_AVAILABLE}bytes`
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
   * Perform a simple health check to see if a primary is truly unhealthy. If the primary returns a
   * non-200 response, track the timestamp in the map. If the health check has failed for a primary over
   * `this.maxNumberSecondsPrimaryRemainsUnhealthy`, return as unhealthy. Else, keep track of the timestamp
   * of the visit if not already tracked.
   *
   * If the primary is healthy, reset the counter in the map and return as healthy.
   * @param {string} primary primary endpoint
   * @returns boolean of whether primary is healthy or not
   */
  async isPrimaryHealthy(primary) {
    const isHealthy = await this.isNodeHealthy(primary, true)

    if (!isHealthy) {
      const failedTimestamp =
        this.getEarliestFailedHealthCheckTimestamp(primary)

      if (failedTimestamp) {
        // Generate the date of the failed timestamp + max hours threshold
        const failedTimestampPlusThreshold = new Date(failedTimestamp)
        failedTimestampPlusThreshold.setSeconds(
          failedTimestamp.getSeconds() +
            MAX_NUMBER_SECONDS_PRIMARY_REMAINS_UNHEALTHY
        )

        // Determine if the failed timestamp + max hours threshold surpasses our allowed time threshold
        const now = new Date()
        if (now >= failedTimestampPlusThreshold) {
          return false
        }
      } else {
        this.addHealthCheckTimestamp(primary)
      }
      return true
    }

    // If a primary ever becomes healthy again and was once marked as unhealthy, remove tracker
    this.removePrimaryFromUnhealthyPrimaryMap(primary)
    return true
  }

  getEarliestFailedHealthCheckTimestamp(primary) {
    return this.primaryToEarliestFailedHealthCheckTimestamp[primary]
      ? this.primaryToEarliestFailedHealthCheckTimestamp[primary]
      : null
  }

  addHealthCheckTimestamp(primary) {
    this.primaryToEarliestFailedHealthCheckTimestamp[primary] = new Date()
  }

  removePrimaryFromUnhealthyPrimaryMap(primary) {
    delete this.primaryToEarliestFailedHealthCheckTimestamp[primary]
  }

  /**
   * @param {Object[]} nodeUserInfoList array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @returns {Set} Set of content node endpoint strings
   */
  _computeContentNodePeerSet(nodeUserInfoList, thisContentNodeEndpoint) {
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
}

module.exports = new CNodeHealthManager()
