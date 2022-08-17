import type Logger from 'bunyan'
import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  UpdateReplicaSetUser,
  ReplicaToUserInfoMap,
  UpdateReplicaSetJobParamsWithoutEnabledReconfigModes
} from '../stateReconciliation/types'
import type {
  FindReplicaSetUpdateJobParams,
  ReplicaToAllUserInfoMaps,
  UserSecondarySyncMetrics,
  FindReplicaSetUpdatesJobReturnValue,
  StateMonitoringUser
} from './types'
import type { SpanContext } from '@opentelemetry/api'
import _ from 'lodash'

import { SemanticAttributes } from '@opentelemetry/semantic-conventions'
import {
  FIND_REPLICA_SET_UPDATES_BATCH_SIZE,
  QUEUE_NAMES
} from '../stateMachineConstants'
import CNodeHealthManager from '../CNodeHealthManager'
import config from '../../../config'
import ContentNodeInfoManager from '../ContentNodeInfoManager'
import { currentSpanContext, instrumentTracing } from '../../../utils/tracing'

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')
const minSecondaryUserSyncSuccessPercent =
  config.get('minimumSecondaryUserSyncSuccessPercent') / 100
const minFailedSyncRequestsBeforeReconfig = config.get(
  'minimumFailedSyncRequestsBeforeReconfig'
)

/**
 * Processes a job to find and return reconfigurations of replica sets that
 * need to occur for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger a logger that can be filtered by jobName and jobId
 * @param {Object[]} param.users array of { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet }
 * @param {string[]} param.unhealthyPeers array of unhealthy peers
 * @param {Object} param.replicaToAllUserInfoMaps map(secondary endpoint => map(user wallet => { clock, filesHash }))
 * @param {string (wallet): Object{ string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }}} param.userSecondarySyncMetricsMap mapping of nodeUser's wallet (string) to metrics for their sync success to secondaries
 */
const findReplicaSetUpdates = async ({
  logger,
  users,
  unhealthyPeers,
  replicaToAllUserInfoMaps,
  userSecondarySyncMetricsMap
}: DecoratedJobParams<FindReplicaSetUpdateJobParams>): Promise<
  DecoratedJobReturnValue<FindReplicaSetUpdatesJobReturnValue>
> => {
  const unhealthyPeersSet = new Set(unhealthyPeers || [])

  // Parallelize calling _findReplicaSetUpdatesForUser on chunks of 500 users at a time
  const userBatches: StateMonitoringUser[][] = _.chunk(
    users,
    FIND_REPLICA_SET_UPDATES_BATCH_SIZE
  )
  const results: (
    | PromiseRejectedResult
    | PromiseFulfilledResult<UpdateReplicaSetOp[]>
  )[] = []
  for (const userBatch of userBatches) {
    const resultBatch: PromiseSettledResult<UpdateReplicaSetOp[]>[] =
      await Promise.allSettled(
        userBatch.map((user: StateMonitoringUser) =>
          findReplicaSetUpdatesForUser(
            user,
            thisContentNodeEndpoint,
            unhealthyPeersSet,
            userSecondarySyncMetricsMap[user.wallet] || {
              [user.secondary1]: {
                successRate: 1,
                successCount: 0,
                failureCount: 0
              },
              [user.secondary2]: {
                successRate: 1,
                successCount: 0,
                failureCount: 0
              }
            },
            minSecondaryUserSyncSuccessPercent,
            minFailedSyncRequestsBeforeReconfig,
            logger
          )
        )
      )
    results.push(...resultBatch)
  }

  // Combine each batch's updateReplicaSet jobs that need to be enqueued
  const updateReplicaSetJobs: UpdateReplicaSetJobParamsWithoutEnabledReconfigModes[] =
    []
  for (const promiseResult of results) {
    // Skip and log failed promises
    const { status: promiseStatus } = promiseResult
    if (promiseStatus === 'rejected') {
      const { reason } = promiseResult
      logger.error(
        `_findReplicaSetUpdatesForUser() encountered unexpected failure: ${
          reason.message || reason
        }`
      )
      continue
    } else if (promiseStatus === 'fulfilled') {
      // Combine each promise's updateReplicaSetOps into a job
      for (const updateReplicaSetOp of promiseResult.value) {
        const { wallet } = updateReplicaSetOp

        updateReplicaSetJobs.push({
          parentSpanContext: currentSpanContext(),
          wallet,
          userId: updateReplicaSetOp.userId,
          primary: updateReplicaSetOp.primary,
          secondary1: updateReplicaSetOp.secondary1,
          secondary2: updateReplicaSetOp.secondary2,
          unhealthyReplicas: Array.from(updateReplicaSetOp.unhealthyReplicas),
          replicaToUserInfoMap: _transformAndFilterReplicaToUserInfoMap(
            replicaToAllUserInfoMaps,
            wallet,
            [
              updateReplicaSetOp.primary,
              updateReplicaSetOp.secondary1,
              updateReplicaSetOp.secondary2
            ]
          )
        })
      }
    } else {
      throw new Error(
        'Encountered a promise that was not fulfilled or rejected'
      )
    }
  }

  return {
    spanContext: currentSpanContext(),
    cNodeEndpointToSpIdMap: ContentNodeInfoManager.getCNodeEndpointToSpIdMap(),
    jobsToEnqueue: updateReplicaSetJobs?.length
      ? {
          [QUEUE_NAMES.UPDATE_REPLICA_SET]: updateReplicaSetJobs
        }
      : undefined
  }
}

type UpdateReplicaSetOp = UpdateReplicaSetUser & {
  unhealthyReplicas: Set<string>
}

/**
 * Determines which replica set update operations should be performed for a given user.
 *
 * @param {Object} user { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {string} thisContentNodeEndpoint URL or IP address of this Content Node
 * @param {Set<string>} unhealthyPeers set of unhealthy peers
 * @param {string (secondary endpoint): Object{ successRate: number (0-1), successCount: number, failureCount: number }} userSecondarySyncMetricsBySecondary mapping of each secondary to the success metrics the nodeUser has had syncing to it
 * * @param {number} minSecondaryUserSyncSuccessPercent 0-1 minimum sync success rate a secondary must have to perform a sync to it
 * @param {number} minFailedSyncRequestsBeforeReconfig minimum number of failed sync requests to a secondary before the user's replica set gets updated to not include the secondary
 * @param {Object} param.logger a logger that can be filtered by jobName and jobId
 */
const _findReplicaSetUpdatesForUser = async (
  user: StateMonitoringUser,
  thisContentNodeEndpoint: string,
  unhealthyPeersSet: Set<string>,
  userSecondarySyncMetricsBySecondary: {
    [secondary: string]: UserSecondarySyncMetrics
  },
  minSecondaryUserSyncSuccessPercent: number,
  minFailedSyncRequestsBeforeReconfig: number,
  logger: Logger
): Promise<UpdateReplicaSetOp[]> => {
  const requiredUpdateReplicaSetOps: UpdateReplicaSetOp[] = []
  const unhealthyReplicas = new Set<string>()

  const {
    wallet,
    primary,
    secondary1,
    secondary2,
    primarySpID,
    secondary1SpID,
    secondary2SpID
  } = user

  /**
   * If this node is primary for user, check both secondaries for health
   * Enqueue SyncRequests against healthy secondaries, and enqueue UpdateReplicaSetOps against unhealthy secondaries
   */
  let replicaSetNodesToObserve = [
    { endpoint: secondary1, spId: secondary1SpID },
    { endpoint: secondary2, spId: secondary2SpID }
  ]

  if (primary === thisContentNodeEndpoint) {
    // filter out false-y values to account for incomplete replica sets
    const secondariesInfo = replicaSetNodesToObserve.filter(
      (entry) => entry.endpoint
    )

    /**
     * For each secondary, add to `unhealthyReplicas` if unhealthy
     */
    for (const secondaryInfo of secondariesInfo) {
      const secondary = secondaryInfo.endpoint

      const { successRate, successCount, failureCount } =
        userSecondarySyncMetricsBySecondary[secondary]

      // Error case 1 - mismatched spID
      if (
        ContentNodeInfoManager.getCNodeEndpointToSpIdMap()[secondary] !==
        secondaryInfo.spId
      ) {
        logger.error(
          `_findReplicaSetUpdatesForUser(): Secondary ${secondary} for user ${wallet} mismatched spID. Expected ${
            secondaryInfo.spId
          }, found ${
            ContentNodeInfoManager.getCNodeEndpointToSpIdMap()[secondary]
          }. Marking replica as unhealthy. Endpoint to spID mapping: ${JSON.stringify(
            ContentNodeInfoManager.getCNodeEndpointToSpIdMap()
          )}`
        )
        unhealthyReplicas.add(secondary)

        // Error case 2 - already marked unhealthy
      } else if (unhealthyPeersSet.has(secondary)) {
        logger.error(
          `_findReplicaSetUpdatesForUser(): Secondary ${secondary} for user ${wallet} in unhealthy peer set. Marking replica as unhealthy. Endpoint to spID mapping: ${JSON.stringify(
            ContentNodeInfoManager.getCNodeEndpointToSpIdMap()
          )}`
        )
        unhealthyReplicas.add(secondary)

        // Error case 3 - low user sync success rate
      } else if (
        failureCount >= minFailedSyncRequestsBeforeReconfig &&
        successRate < minSecondaryUserSyncSuccessPercent
      ) {
        logger.error(
          `_findReplicaSetUpdatesForUser(): Secondary ${secondary} for user ${wallet} has userSyncSuccessRate of ${successRate}, which is below threshold of ${minSecondaryUserSyncSuccessPercent}. ${successCount} Successful syncs vs ${failureCount} Failed syncs. Marking replica as unhealthy. Endpoint to spID mapping: ${JSON.stringify(
            ContentNodeInfoManager.getCNodeEndpointToSpIdMap()
          )}`
        )
        unhealthyReplicas.add(secondary)
      }
    }

    /**
     * If this node is secondary for user, check both secondaries for health and enqueue replica set updates if needed
     */
  } else {
    // filter out false-y values to account for incomplete replica sets and filter out the
    // the self node
    replicaSetNodesToObserve = [
      { endpoint: primary, spId: primarySpID },
      ...replicaSetNodesToObserve
    ]
    replicaSetNodesToObserve = replicaSetNodesToObserve.filter((entry) => {
      return entry.endpoint && entry.endpoint !== thisContentNodeEndpoint
    })

    for (const replica of replicaSetNodesToObserve) {
      // If the map's spId does not match the query's spId, then regardless
      // of the relationship of the node to the user, issue a reconfig for that node
      if (
        ContentNodeInfoManager.getCNodeEndpointToSpIdMap()[replica.endpoint] !==
        replica.spId
      ) {
        unhealthyReplicas.add(replica.endpoint)
      } else if (unhealthyPeersSet.has(replica.endpoint)) {
        // Else, continue with conducting extra health check if the current observed node is a primary, and
        // add to `unhealthyReplicas` if observed node is a secondary
        let addToUnhealthyReplicas = true

        if (replica.endpoint === primary) {
          addToUnhealthyReplicas = !(await CNodeHealthManager.isPrimaryHealthy(
            primary
          ))
        }

        if (addToUnhealthyReplicas) {
          unhealthyReplicas.add(replica.endpoint)
        }
      }
    }
  }

  // If any unhealthy replicas found for user, enqueue an updateReplicaSetOp for later processing
  if (unhealthyReplicas.size > 0) {
    requiredUpdateReplicaSetOps.push({
      wallet: user.wallet,
      userId: user.user_id,
      primary: user.primary,
      secondary1: user.secondary1,
      secondary2: user.secondary2,
      unhealthyReplicas
    })
  }

  return requiredUpdateReplicaSetOps
}

const findReplicaSetUpdatesForUser = instrumentTracing({
  fn: _findReplicaSetUpdatesForUser
})

/**
 * Filters input map to only include the given wallet and replica set nodes
 * @param {Object} replicaToAllUserInfoMaps map(secondary endpoint => map(user wallet => { clock, filesHash }))
 * @param {string} wallet the wallet to filter by (other wallets will be excluded from the output)
 * @param {string[]} replicaSet the replica set to filter by (other replica sets will be excluded from the output)
 * @returns map(replica (string) => { clock (number), filesHash (string) } ) mapping of node endpoint to user info on that node for the given wallet and replica set
 */
const _transformAndFilterReplicaToUserInfoMap = (
  replicaToAllUserInfoMaps: ReplicaToAllUserInfoMaps,
  wallet: string,
  replicaSet: string[]
): ReplicaToUserInfoMap => {
  return Object.fromEntries(
    Object.entries(replicaToAllUserInfoMaps) // [[replica, map(wallet => { clock, filesHash })]]
      .map(
        ([node, userInfoMapsForNode]) =>
          [
            node,
            {
              ...userInfoMapsForNode[wallet],
              clock: userInfoMapsForNode[wallet]?.clock || -1 // default clock to -1 where not present
            }
          ] as const
      )
      // Only include nodes in the user's replica set
      .filter(([node, _]) => replicaSet.includes(node))
  )
}

module.exports = async (
  params: DecoratedJobParams<FindReplicaSetUpdateJobParams>
) => {
  const { parentSpanContext } = params
  return instrumentTracing({
    name: 'findReplicaSetUpdates.jobProcessor',
    fn: findReplicaSetUpdates,
    options: {
      links: parentSpanContext
        ? [
            {
              context: parentSpanContext
            }
          ]
        : [],
      attributes: {
        [SemanticAttributes.CODE_FILEPATH]: __filename
      }
    }
  })(params)
}
