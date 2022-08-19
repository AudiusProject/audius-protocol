import type {
  ReplicaSetNodesToUserWalletsMap,
  StateMonitoringUser,
  UserSecondarySyncMetricsMap
} from './types'
import type { WalletsToSecondariesMapping } from '../types'

// eslint-disable-next-line import/no-unresolved
import SecondarySyncHealthTracker from '../stateReconciliation/SecondarySyncHealthTracker'

const _ = require('lodash')
const axios = require('axios')
const { CancelToken } = axios

const asyncRetry = require('../../../utils/asyncRetry')
const { logger } = require('../../../logging')

const DBManager = require('../../../dbManager')

const {
  GET_NODE_USERS_TIMEOUT_MS,
  GET_NODE_USERS_CANCEL_TOKEN_MS,
  GET_NODE_USERS_DEFAULT_PAGE_SIZE,
  SYNC_MODES,
  FETCH_FILES_HASH_NUM_RETRIES
} = require('../stateMachineConstants')

/**
 * @param discoveryNodeEndpoint the endpoint of the Discovery Node to request the latest user ID from
 * @returns the ID of the newest user on Audius
 */
const getLatestUserIdFromDiscovery = async (discoveryNodeEndpoint: string) => {
  // Will throw error on non-200 response
  let latestUserId = 0
  try {
    // Request all users that have this node as a replica (either primary or secondary)
    const resp = await asyncRetry({
      logLabel: 'fetch the ID of the newest user on Audius',
      asyncFn: async () => {
        return axios({
          method: 'get',
          baseURL: discoveryNodeEndpoint,
          url: `latest/user`,
          timeout: 10_000 // 10s
        })
      },
      logger
    })
    latestUserId = resp.data.data
  } catch (e: any) {
    throw new Error(
      `getLatestUserIdFromDiscovery() Error: ${e.toString()} - connected discovery node: [${discoveryNodeEndpoint}]`
    )
  }

  return latestUserId
}

/**
 * Retrieve users with this node as replica (primary or secondary).
 * Makes request (with retries) to discovery node to retrieve all users, optionally paginated
 *
 * @notice Discovery Nodes will ignore these params if they're not updated to the version which added pagination
 * @param {string} discoveryNodeEndpoint the IP address / URL of a Discovery Node to make requests to
 * @param {string} contentNodeEndpoint the IP address / URL of the Content Node to fetch users from (users must have this CN as their primary or secondary)
 * @param prevUserId user_id is used for pagination, where each paginated request returns
 *                   maxUsers number of users starting at a user with id=user_id
 * @param maxUsers the maximum number of users to fetch
 * @returns {Object[]} array of objects of shape { primary, secondary1, secondary2, user_id, wallet, primarySpID, secondary1SpID, secondary2SpID }
 */
const getNodeUsers = async (
  discoveryNodeEndpoint: string,
  contentNodeEndpoint: string,
  prevUserId = 0,
  maxUsers = GET_NODE_USERS_DEFAULT_PAGE_SIZE
) => {
  // Will throw error on non-200 response
  let nodeUsers
  try {
    // Cancel the request if it hasn't succeeded/failed/timed out after 70 seconds
    const cancelTokenSource = CancelToken.source()
    setTimeout(
      () =>
        cancelTokenSource.cancel(
          `getNodeUsers() took more than ${GET_NODE_USERS_CANCEL_TOKEN_MS}ms and did not time out`
        ),
      GET_NODE_USERS_CANCEL_TOKEN_MS
    )

    // Request all users that have this node as a replica (either primary or secondary)
    const resp = await asyncRetry({
      logLabel: 'fetch all users with this node in replica',
      asyncFn: async () => {
        return axios({
          method: 'get',
          baseURL: discoveryNodeEndpoint,
          url: `v1/full/users/content_node/all`,
          params: {
            creator_node_endpoint: contentNodeEndpoint,
            prev_user_id: prevUserId,
            max_users: maxUsers
          },
          timeout: GET_NODE_USERS_TIMEOUT_MS,
          cancelToken: cancelTokenSource.token
        })
      },
      logger
    })
    nodeUsers = resp.data.data
  } catch (e: any) {
    if (axios.isCancel(e)) {
      logger.error(`getNodeUsers() request canceled: ${e.message}`)
    }
    throw new Error(
      `getNodeUsers() Error: ${e.toString()} - connected discovery node [${discoveryNodeEndpoint}]`
    )
  } finally {
    logger.info(`getNodeUsers() nodeUsers.length: ${nodeUsers?.length}`)
  }

  // Ensure every object in response array contains all required fields
  for (const nodeUser of nodeUsers) {
    const requiredFields = [
      'user_id',
      'wallet',
      'primary',
      'secondary1',
      'secondary2',
      'primarySpID',
      'secondary1SpID',
      'secondary2SpID'
    ]
    const responseFields = Object.keys(nodeUser)
    const allRequiredFieldsPresent = requiredFields.every((requiredField) =>
      responseFields.includes(requiredField)
    )
    if (!allRequiredFieldsPresent) {
      throw new Error(
        'getNodeUsers() Error: Unexpected response format during getNodeUsers() call'
      )
    }
  }

  return nodeUsers
}

/**
 * Converts provided array of nodeUser info to issue to a map(replica set node => userWallets[]) for easier access
 *
 * @param {Array} nodeUsers array of objects with schema { user_id, wallet, primary, secondary1, secondary2 }
 * @returns {Object} map of replica set endpoint strings to array of wallet strings of users with that node as part of replica set
 */
const buildReplicaSetNodesToUserWalletsMap = (
  nodeUsers: StateMonitoringUser[]
): ReplicaSetNodesToUserWalletsMap => {
  const replicaSetNodesToUserWalletsMap: ReplicaSetNodesToUserWalletsMap = {}

  nodeUsers.forEach((userInfo) => {
    const { wallet, primary, secondary1, secondary2 } = userInfo
    const replicaSet = [primary, secondary1, secondary2]

    replicaSet.forEach((node) => {
      if (!replicaSetNodesToUserWalletsMap[node]) {
        replicaSetNodesToUserWalletsMap[node] = []
      }

      replicaSetNodesToUserWalletsMap[node].push(wallet)
    })
  })

  return replicaSetNodesToUserWalletsMap
}

const computeUserSecondarySyncSuccessRatesMap = async (
  users: StateMonitoringUser[] = []
): Promise<UserSecondarySyncMetricsMap> => {
  // Map each user to truthy secondaries (ignore empty secondaries that result from incomplete replica sets)
  const walletsToSecondariesMapping: WalletsToSecondariesMapping = {}
  for (const user of users) {
    const { wallet, secondary1, secondary2 } = user
    const secondaries = [secondary1, secondary2].filter(Boolean)
    walletsToSecondariesMapping[wallet] = secondaries
  }

  const userSecondarySyncMetricsMap: UserSecondarySyncMetricsMap =
    await SecondarySyncHealthTracker.computeUsersSecondarySyncSuccessRatesForToday(
      walletsToSecondariesMapping
    )

  return userSecondarySyncMetricsMap
}

/**
 * Given user state info, determines required sync mode for user and replica. This fn is called for each (primary, secondary) pair
 *
 * It is possible for filesHashes to diverge despite clock equality because clock equality can happen if different content with same number of clockRecords is uploaded to different replicas.
 * This is an error condition and needs to be identified and rectified.
 *
 * @param {Object} param
 * @param {string} param.wallet user wallet
 * @param {number} param.primaryClock clock value on user's primary
 * @param {number} param.secondaryClock clock value on user's secondary
 * @param {string} param.primaryFilesHash filesHash on user's primary
 * @param {string} param.secondaryFilesHash filesHash on user's secondary
 * @returns {SYNC_MODES} syncMode one of None, SyncSecondaryFromPrimary, MergePrimaryAndSecondary
 */
const computeSyncModeForUserAndReplica = async ({
  wallet,
  primaryClock,
  secondaryClock,
  primaryFilesHash,
  secondaryFilesHash
}: {
  wallet: string
  primaryClock: number
  secondaryClock: number
  primaryFilesHash: string | null
  secondaryFilesHash: string | null
}) => {
  if (
    !Number.isInteger(primaryClock) ||
    !Number.isInteger(secondaryClock) ||
    // `null` is a valid filesHash value; `undefined` is not
    primaryFilesHash === undefined ||
    secondaryFilesHash === undefined
  ) {
    throw new Error(
      '[computeSyncModeForUserAndReplica()] Error: Missing or invalid params'
    )
  }

  if (
    primaryClock === secondaryClock &&
    primaryFilesHash !== secondaryFilesHash
  ) {
    /**
     * This is an error condition, indicating that primary and secondary states for user have diverged.
     * To fix this issue, primary should sync content from secondary and then force secondary to resync its entire state from primary.
     */
    return SYNC_MODES.MergePrimaryAndSecondary
  } else if (primaryClock < secondaryClock) {
    /**
     * Secondary has more data than primary -> primary must sync from secondary
     */

    return SYNC_MODES.MergePrimaryAndSecondary
  } else if (primaryClock > secondaryClock && secondaryFilesHash === null) {
    /**
     * secondaryFilesHash will be null if secondary has no clockRecords for user -> secondary must sync from primary
     */

    return SYNC_MODES.SyncSecondaryFromPrimary
  } else if (primaryClock > secondaryClock && secondaryFilesHash !== null) {
    /**
     * If primaryClock > secondaryClock, need to check that nodes have same content for each clock value. To do this, we compute filesHash from primary matching clock range from secondary.
     */

    let primaryFilesHashForRange
    try {
      // Throws error if fails after all retries
      primaryFilesHashForRange = await asyncRetry({
        asyncFn: async () =>
          DBManager.fetchFilesHashFromDB({
            lookupKey: { lookupWallet: wallet },
            clockMin: 0,
            clockMax: secondaryClock + 1
          }),
        options: { retries: FETCH_FILES_HASH_NUM_RETRIES },
        logger,
        logLabel:
          '[computeSyncModeForUserAndReplica()] [DBManager.fetchFilesHashFromDB()]'
      })
    } catch (e: any) {
      const errorMsg = `[computeSyncModeForUserAndReplica()] [DBManager.fetchFilesHashFromDB()] Error - ${e.message}`
      logger.error(errorMsg)
      throw new Error(errorMsg)
    }

    if (primaryFilesHashForRange === secondaryFilesHash) {
      return SYNC_MODES.SyncSecondaryFromPrimary
    } else {
      return SYNC_MODES.MergePrimaryAndSecondary
    }
  } else {
    /**
     * primaryClock === secondaryClock && primaryFilesHash === secondaryFilesHash
     * Nodes have identical data = healthy state -> no sync needed
     */

    return SYNC_MODES.None
  }
}

module.exports = {
  getLatestUserIdFromDiscovery,
  getNodeUsers,
  buildReplicaSetNodesToUserWalletsMap,
  computeUserSecondarySyncSuccessRatesMap,
  computeSyncModeForUserAndReplica
}
