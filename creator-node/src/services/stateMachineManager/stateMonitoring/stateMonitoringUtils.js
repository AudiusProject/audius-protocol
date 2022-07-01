const _ = require('lodash')
const axios = require('axios')
const { CancelToken } = axios

const config = require('../../../config')
const Utils = require('../../../utils')
const { isPrimaryHealthy } = require('../CNodeHealthManager')
const { logger } = require('../../../logging')
const SecondarySyncHealthTracker = require('../../../snapbackSM/secondarySyncHealthTracker')
const {
  AGGREGATE_RECONFIG_AND_POTENTIAL_SYNC_OPS_BATCH_SIZE,
  GET_NODE_USERS_TIMEOUT_MS,
  GET_NODE_USERS_CANCEL_TOKEN_MS,
  GET_NODE_USERS_DEFAULT_PAGE_SIZE
} = require('../stateMachineConstants')

const MIN_FAILED_SYNC_REQUESTS_BEFORE_RECONFIG = config.get(
  'minimumFailedSyncRequestsBeforeReconfig'
)
const MIN_SECONDARY_USER_SYNC_SUCCESS_PERCENT =
  config.get('minimumSecondaryUserSyncSuccessPercent') / 100

/**
 * @param discoveryNodeEndpoint the endpoint of the Discovery Node to request the latest user ID from
 * @returns the ID of the newest user on Audius
 */
const getLatestUserIdFromDiscovery = async (discoveryNodeEndpoint) => {
  // Will throw error on non-200 response
  let latestUserId = 0
  try {
    // Request all users that have this node as a replica (either primary or secondary)
    const resp = await Utils.asyncRetry({
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
  } catch (e) {
    throw new Error(
      `getLatestUserIdFromDiscovery() Error: ${e.toString()} - connected discovery node: [${discoveryNodeEndpoint}]`
    )
  }

  return latestUserId
}

/**
 * Retrieve users with this node as replica (primary or secondary).
 * Makes single request to discovery node to retrieve all users, optionally paginated
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
  discoveryNodeEndpoint,
  contentNodeEndpoint,
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
    const resp = await Utils.asyncRetry({
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
  } catch (e) {
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
const buildReplicaSetNodesToUserWalletsMap = (nodeUsers) => {
  const replicaSetNodesToUserWalletsMap = {}

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

const computeUserSecondarySyncSuccessRatesMap = async (nodeUsers) => {
  // Map each nodeUser to truthy secondaries (ignore empty secondaries that result from incomplete replica sets)
  const walletsToSecondariesMapping = {}
  for (const nodeUser of nodeUsers) {
    const { wallet, secondary1, secondary2 } = nodeUser
    const secondaries = [secondary1, secondary2].filter(Boolean)
    walletsToSecondariesMapping[wallet] = secondaries
  }

  const userSecondarySyncMetricsMap =
    await SecondarySyncHealthTracker.computeUsersSecondarySyncSuccessRatesForToday(
      walletsToSecondariesMapping
    )

  return userSecondarySyncMetricsMap
}

module.exports = {
  getLatestUserIdFromDiscovery,
  getNodeUsers,
  buildReplicaSetNodesToUserWalletsMap,
  computeUserSecondarySyncSuccessRatesMap
}
