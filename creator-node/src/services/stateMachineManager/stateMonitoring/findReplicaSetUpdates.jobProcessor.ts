import type Logger from 'bunyan'
import type { LoDashStatic } from 'lodash'
import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  UpdateReplicaSetUser,
  ReplicaToUserInfoMap,
  UpdateReplicaSetJobParamsWithoutEnabledReconfigModes,
  SecondarySyncHealthTrackerState
} from '../stateReconciliation/types'
import type {
  FindReplicaSetUpdateJobParams,
  ReplicaToAllUserInfoMaps,
  FindReplicaSetUpdatesJobReturnValue,
  StateMonitoringUser
} from './types'
import { instrumentTracing, tracing } from '../../../tracer'
import { stringifyMap } from '../../../utils'
import { getMapOfCNodeEndpointToSpId } from '../../ContentNodeInfoManager'
import { CNodeHealthManager } from '../CNodeHealthManager'
import { SecondarySyncHealthTracker } from '../stateReconciliation/SecondarySyncHealthTracker'

const _: LoDashStatic = require('lodash')

const {
  FIND_REPLICA_SET_UPDATES_BATCH_SIZE,
  QUEUE_NAMES
} = require('../stateMachineConstants')
const config = require('../../../config')

const thisContentNodeEndpoint = config.get('creatorNodeEndpoint')

/**
 * Processes a job to find and return reconfigurations of replica sets that
 * need to occur for the given array of users.
 *
 * @param {Object} param job data
 * @param {Object} param.logger a logger that can be filtered by jobName and jobId
 * @param {Object[]} param.users array of { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet }
 * @param {string[]} param.unhealthyPeers array of unhealthy peers
 * @param {Object} param.replicaToAllUserInfoMaps map(secondary endpoint => map(user wallet => { clock, filesHash }))
 * @param {SecondarySyncHealthTrackerState} param.secondarySyncHealthTrackerState serialized data used to determine if secondary is unhealthy for wallet
 */
async function findReplicaSetUpdates({
  logger,
  users,
  unhealthyPeers,
  replicaToAllUserInfoMaps,
  secondarySyncHealthTrackerState
}: DecoratedJobParams<FindReplicaSetUpdateJobParams>): Promise<
  DecoratedJobReturnValue<FindReplicaSetUpdatesJobReturnValue>
> {
  const unhealthyPeersSet = new Set(unhealthyPeers || [])
  const cNodeEndpointToSpIdMap = await getMapOfCNodeEndpointToSpId(logger)

  // Parallelize calling findReplicaSetUpdatesForUser on chunks of 500 users at a time
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
          findReplicaSetUpdatesForUser({
            user,
            thisContentNodeEndpoint,
            unhealthyPeersSet,
            secondarySyncHealthTrackerState,
            cNodeEndpointToSpIdMap,
            logger
          })
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
        `findReplicaSetUpdatesForUser() encountered unexpected failure: ${
          reason.message || reason
        }`
      )
      continue
    } else if (promiseStatus === 'fulfilled') {
      // Combine each promise's updateReplicaSetOps into a job
      for (const updateReplicaSetOp of promiseResult.value) {
        const { wallet } = updateReplicaSetOp

        updateReplicaSetJobs.push({
          wallet,
          userId: updateReplicaSetOp.userId,
          primary: updateReplicaSetOp.primary,
          secondary1: updateReplicaSetOp.secondary1,
          secondary2: updateReplicaSetOp.secondary2,
          nodesToReconfigOffOf: Array.from(
            updateReplicaSetOp.nodesToReconfigOffOf
          ),
          replicaToUserInfoMap: _transformAndFilterReplicaToUserInfoMap(
            replicaToAllUserInfoMaps,
            wallet,
            [
              updateReplicaSetOp.primary,
              updateReplicaSetOp.secondary1,
              updateReplicaSetOp.secondary2
            ]
          ),
          parentSpanContext: tracing.currentSpanContext()
        })
      }
    } else {
      throw new Error(
        'Encountered a promise that was not fulfilled or rejected'
      )
    }
  }

  return {
    cNodeEndpointToSpIdMap: stringifyMap(cNodeEndpointToSpIdMap),
    jobsToEnqueue: updateReplicaSetJobs?.length
      ? {
          [QUEUE_NAMES.UPDATE_REPLICA_SET]: updateReplicaSetJobs
        }
      : undefined
  }
}

type UpdateReplicaSetOp = UpdateReplicaSetUser & {
  nodesToReconfigOffOf: Set<string>
}

/**
 * Determines which replica set update operations should be performed for a given user.
 *
 * @param {Object} param
 * @param {Object} param.user { primary, secondary1, secondary2, primarySpID, secondary1SpID, secondary2SpID, user_id, wallet}
 * @param {string} param.thisContentNodeEndpoint URL or IP address of this Content Node
 * @param {Set<string>} param.unhealthyPeers set of unhealthy peers
 * @param {SecondarySyncHealthTrackerState} param.secondarySyncHealthTrackerState serialized data used to determine if secondary is unhealthy for wallet
 * @param {Object} param.cNodeEndpointToSpIdMap map of content node endpoint to sp id
 * @param {Object} param.logger a logger that can be filtered by jobName and jobId
 */
const _findReplicaSetUpdatesForUser = async ({
  user,
  thisContentNodeEndpoint,
  unhealthyPeersSet,
  secondarySyncHealthTrackerState,
  cNodeEndpointToSpIdMap,
  logger
}: {
  user: StateMonitoringUser
  thisContentNodeEndpoint: string
  unhealthyPeersSet: Set<string>
  secondarySyncHealthTrackerState: SecondarySyncHealthTrackerState
  cNodeEndpointToSpIdMap: Map<string, number>
  logger: Logger
}): Promise<UpdateReplicaSetOp[]> => {
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

  // If the user was on an old client (pre-URSM), they could have a null replica set on URSM.
  // This will be resolved by client-side sanity checks next time they use the client.
  // Any replica set update we issue here will fail because they have no primary SP ID that can be verified from chain.
  if (
    primarySpID === null &&
    secondary1SpID === null &&
    secondary1SpID === null
  ) {
    logger.error(
      `User ${wallet} has null SP IDs for their entire replica set. Replica set endpoints: [${primary},${secondary1},${secondary2}]`
    )
    return requiredUpdateReplicaSetOps
  }

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

    const secondarySyncHealthTracker = new SecondarySyncHealthTracker(
      secondarySyncHealthTrackerState
    )

    for (const secondaryInfo of secondariesInfo) {
      const secondary = secondaryInfo.endpoint

      const maxErrorsEncountered =
        secondarySyncHealthTracker.doesWalletOnSecondaryExceedMaxErrorsAllowed(
          wallet,
          secondary
        )

      // Error case 1 - mismatched spID
      const spIdFromChain = cNodeEndpointToSpIdMap.get(secondary)
      if (spIdFromChain !== secondaryInfo.spId) {
        logger.error(
          `_findReplicaSetUpdatesForUser(): Secondary ${secondary} for user ${wallet} mismatched spID. Expected ${secondaryInfo.spId}, found ${spIdFromChain}. Marking replica as unhealthy.`
        )
        unhealthyReplicas.add(secondary)

        // Error case 2 - already marked unhealthy
      } else if (unhealthyPeersSet.has(secondary)) {
        logger.error(
          `_findReplicaSetUpdatesForUser(): Secondary ${secondary} for user ${wallet} in unhealthy peer set. Marking replica as unhealthy.`
        )
        unhealthyReplicas.add(secondary)

        // Error case 3 - encountered errors exceed max threshold
      } else if (maxErrorsEncountered) {
        logger.error(
          `_findReplicaSetUpdatesForUser(): Secondary ${secondary} for user ${wallet} encountered too many sync errors. Marking replica as unhealthy.`
        )
        unhealthyReplicas.add(secondary)
      }
    }

    /**
     * If this node is secondary for user, check primary and non-self secondary for health and enqueue replica set updates if needed
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
      const spIdFromChain = cNodeEndpointToSpIdMap.get(replica.endpoint)
      if (spIdFromChain !== replica.spId) {
        logger.error(
          `_findReplicaSetUpdatesForUser(): Replica ${replica.endpoint} for user ${wallet} mismatched spID. Expected ${replica.spId}, found ${spIdFromChain}.`
        )
        unhealthyReplicas.add(replica.endpoint)
      } else if (unhealthyPeersSet.has(replica.endpoint)) {
        logger.error(
          `_findReplicaSetUpdatesForUser(): Replica ${replica.endpoint} for user ${wallet} was already marked unhealthy.`
        )
        unhealthyReplicas.add(replica.endpoint)
      }
    }
  }

  // If any unhealthy replicas found for user, enqueue an updateReplicaSetOp for later processing
  const nodesToReconfigOffOf = new Set<string>()
  for (const node of unhealthyReplicas) {
    const shouldReconfigOffNode =
      !(await CNodeHealthManager.isNodeHealthyOrInGracePeriod(
        node,
        node === primary
      ))
    if (shouldReconfigOffNode) nodesToReconfigOffOf.add(node)
  }
  if (nodesToReconfigOffOf.size) {
    requiredUpdateReplicaSetOps.push({
      wallet: user.wallet,
      userId: user.user_id,
      primary: user.primary,
      secondary1: user.secondary1,
      secondary2: user.secondary2,
      nodesToReconfigOffOf
    })
  }

  return requiredUpdateReplicaSetOps
}

const findReplicaSetUpdatesForUser = instrumentTracing({
  fn: _findReplicaSetUpdatesForUser,
  options: {
    attributes: {
      [tracing.CODE_FILEPATH]: __filename
    }
  }
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
  const jobProcessor = instrumentTracing({
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
        [tracing.CODE_FILEPATH]: __filename
      }
    }
  })

  return await jobProcessor(params)
}
