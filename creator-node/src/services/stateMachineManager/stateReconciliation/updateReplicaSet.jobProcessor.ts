import type Logger from 'bunyan'
import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  IssueSyncRequestJobParams,
  NewReplicaSet,
  ReplicaToUserInfoMap,
  UpdateReplicaSetJobParams,
  UpdateReplicaSetJobReturnValue
} from './types'

const _ = require('lodash')

const config = require('../../../config')
const {
  SyncType,
  RECONFIG_MODES,
  MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS,
  QUEUE_NAMES,
  SYNC_MODES
} = require('../stateMachineConstants')
const { retrieveClockValueForUserFromReplica } = require('../stateMachineUtils')
const CNodeToSpIdMapManager = require('../CNodeToSpIdMapManager')
const { getNewOrExistingSyncReq } = require('./stateReconciliationUtils')
const initAudiusLibs = require('../../initAudiusLibs')

const reconfigNodeWhitelist = config.get('reconfigNodeWhitelist')
  ? new Set(config.get('reconfigNodeWhitelist').split(','))
  : null

/**
 * Updates replica sets of a user who has one or more unhealthy nodes as their primary or secondaries.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {number} param.wallet the public key of the user whose replica set will be reconfigured
 * @param {number} param.userId the id of the user whose replica set will be reconfigured
 * @param {number} param.primary the current primary endpoint of the user whose replica set will be reconfigured
 * @param {number} param.secondary1 the current secondary1 endpoint of the user whose replica set will be reconfigured
 * @param {number} param.secondary2 the current secondary2 endpoint of the user whose replica set will be reconfigured
 * @param {string[]} param.unhealthyReplicas the endpoints of the user's replica set that are currently unhealthy
 * @param {Object} param.replicaToUserInfoMap map(secondary endpoint => { clock, filesHash }) map of user's node endpoint strings to user info on node for user whose replica set should be updated
 * @param {string[]} param.enabledReconfigModes array of which reconfig modes are enabled
 */
module.exports = async function ({
  logger,
  wallet,
  userId,
  primary,
  secondary1,
  secondary2,
  unhealthyReplicas,
  replicaToUserInfoMap,
  enabledReconfigModes
}: DecoratedJobParams<UpdateReplicaSetJobParams>): Promise<
  DecoratedJobReturnValue<UpdateReplicaSetJobReturnValue>
> {
  /**
   * Fetch all the healthy nodes while disabling sync checks to select nodes for new replica set
   * Note: sync checks are disabled because there should not be any syncs occurring for a particular user
   * on a new replica set. Also, the sync check logic is coupled with a user state on the userStateManager.
   * There will be an explicit clock value check on the newly selected replica set nodes instead.
   */
  const audiusLibs = await initAudiusLibs(true)
  const { services: healthyServicesMap } =
    await audiusLibs.ServiceProvider.autoSelectCreatorNodes({
      performSyncCheck: false,
      whitelist: reconfigNodeWhitelist,
      log: true
    })

  const healthyNodes = Object.keys(healthyServicesMap || {})
  if (healthyNodes.length === 0)
    throw new Error(
      'Auto-selecting Content Nodes returned an empty list of healthy nodes.'
    )

  let errorMsg = ''
  let issuedReconfig = false
  let syncJobsToEnqueue: IssueSyncRequestJobParams[] = []
  let newReplicaSet: NewReplicaSet = {
    newPrimary: null,
    newSecondary1: null,
    newSecondary2: null,
    issueReconfig: false,
    reconfigType: null
  }
  try {
    newReplicaSet = await _determineNewReplicaSet({
      logger,
      wallet,
      primary,
      secondary1,
      secondary2,
      unhealthyReplicasSet: new Set(unhealthyReplicas || []),
      healthyNodes,
      replicaToUserInfoMap,
      enabledReconfigModes
    })
    ;({ errorMsg, issuedReconfig, syncJobsToEnqueue } =
      await _issueUpdateReplicaSetOp(
        userId,
        wallet,
        primary,
        secondary1,
        secondary2,
        newReplicaSet,
        audiusLibs,
        logger
      ))
  } catch (e: any) {
    logger.error(
      `ERROR issuing update replica set op: userId=${userId} wallet=${wallet} old replica set=[${primary},${secondary1},${secondary2}] | Error: ${e.toString()}`
    )
    errorMsg = e.toString()
  }

  return {
    errorMsg,
    issuedReconfig,
    newReplicaSet,
    healthyNodes,
    jobsToEnqueue: syncJobsToEnqueue?.length
      ? {
          [QUEUE_NAMES.RECURRING_SYNC]: syncJobsToEnqueue
        }
      : undefined
  }
}

type DetermineNewReplicaSetParams = {
  logger: Logger
  primary: string
  secondary1: string
  secondary2: string
  wallet: string
  unhealthyReplicasSet: Set<string>
  healthyNodes: string[]
  replicaToUserInfoMap: ReplicaToUserInfoMap
  enabledReconfigModes: string[]
}
/**
 * Logic to determine the new replica set.
 *
 * The logic below is as follows:
 * 1. Select the unhealthy replica set nodes size worth of healthy nodes to prepare for issuing reconfig
 * 2. Depending the number and type of unhealthy nodes in `unhealthyReplicaSet`, issue reconfig depending on if the reconfig mode is enabled:
 *  - if one secondary is unhealthy -> {primary: current primary, secondary1: the healthy secondary, secondary2: new healthy node}
 *  - if two secondaries are unhealthy -> {primary: current primary, secondary1: new healthy node, secondary2: new healthy node}
 *  - ** if one primary is unhealthy -> {primary: higher clock value of the two secondaries, secondary1: the healthy secondary, secondary2: new healthy node}
 *  - ** if one primary and one secondary are unhealthy -> {primary: the healthy secondary, secondary1: new healthy node, secondary2: new healthy node}
 *  - if entire replica set is unhealthy -> {primary: null, secondary1: null, secondary2: null, issueReconfig: false}
 *
 * ** - If in the case a primary is ever unhealthy, we do not want to pre-emptively issue a reconfig and cycle out the primary. See `../CNodeHealthManager.js` for more information.
 *
 * Also, there is the notion of `issueReconfig` flag. This value is used to determine whether or not to issue a reconfig based on the currently enabled reconfig mode. See `RECONFIG_MODE` variable for more information.
 *
 * @param {Object} param
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {string} param.primary current user's primary endpoint
 * @param {string} param.secondary1 current user's first secondary endpoint
 * @param {string} param.secondary2 current user's second secondary endpoint
 * @param {string} param.wallet current user's wallet address
 * @param {Set<string>} param.unhealthyReplicasSet a set of endpoints of unhealthy replica set nodes
 * @param {string[]} param.healthyNodes array of healthy Content Node endpoints used for selecting new replica set
 * @param {Object} param.replicaSetNodesToUserClockStatusesMap map of secondary endpoint strings to clock value of secondary for user whose replica set should be updated
 * @param {Object} param.replicaToUserInfoMap map(secondary endpoint => { clock, filesHash }) map of user's node endpoint strings to user info on node for user whose replica set should be updated
 * @param {string[]} param.enabledReconfigModes array of which reconfig modes are enabled
 * @returns {Object}
 * {
 *  newPrimary: {string | null} the endpoint of the newly selected primary or null,
 *  newSecondary1: {string | null} the endpoint of the newly selected secondary #1,
 *  newSecondary2: {string | null} the endpoint of the newly selected secondary #2,
 *  issueReconfig: {boolean} flag to issue reconfig or not
 * }
 */
const _determineNewReplicaSet = async ({
  logger,
  primary,
  secondary1,
  secondary2,
  wallet,
  unhealthyReplicasSet,
  healthyNodes,
  replicaToUserInfoMap,
  enabledReconfigModes
}: DetermineNewReplicaSetParams) => {
  const currentReplicaSet = [primary, secondary1, secondary2]
  const healthyReplicaSet = new Set(
    currentReplicaSet.filter((node) => !unhealthyReplicasSet.has(node))
  )
  const newReplicaNodes = await _selectRandomReplicaSetNodes(
    healthyReplicaSet,
    unhealthyReplicasSet.size,
    healthyNodes,
    wallet,
    logger
  )

  if (unhealthyReplicasSet.size === 1) {
    return _determineNewReplicaSetWhenOneNodeIsUnhealthy(
      primary,
      secondary1,
      secondary2,
      unhealthyReplicasSet,
      replicaToUserInfoMap,
      newReplicaNodes[0],
      enabledReconfigModes
    )
  } else if (unhealthyReplicasSet.size === 2) {
    return _determineNewReplicaSetWhenTwoNodesAreUnhealthy(
      primary,
      secondary1,
      secondary2,
      unhealthyReplicasSet,
      newReplicaNodes,
      enabledReconfigModes
    )
  }

  // Can't replace all 3 replicas because there would be no replica to sync from
  return {
    newPrimary: null,
    newSecondary1: null,
    newSecondary2: null,
    issueReconfig: false,
    reconfigType: null
  }
}

/**
 * Determines new replica set when one node in the current replica set is unhealthy.
 * @param {*} primary user's current primary endpoint
 * @param {*} secondary1 user's current first secondary endpoint
 * @param {*} secondary2 user's current second secondary endpoint
 * @param {*} unhealthyReplicasSet a set of endpoints of unhealthy replica set nodes
 * @param {Object} param.replicaToUserInfoMap map(secondary endpoint => { clock, filesHash }) map of user's node endpoint strings to user info on node for user whose replica set should be updated
 * @param {*} newReplicaNode endpoint of node that will replace the unhealthy node
 * @returns reconfig info to update the user's replica set to replace the 1 unhealthy node
 */
const _determineNewReplicaSetWhenOneNodeIsUnhealthy = (
  primary: string,
  secondary1: string,
  secondary2: string,
  unhealthyReplicasSet: Set<string>,
  replicaToUserInfoMap: ReplicaToUserInfoMap,
  newReplicaNode: string,
  enabledReconfigModes: string[]
) => {
  // If we already already checked this primary and it failed the health check, select the higher clock
  // value of the two secondaries as the new primary, leave the other as the first secondary, and select a new second secondary
  if (unhealthyReplicasSet.has(primary)) {
    const [newPrimary, currentHealthySecondary] =
      replicaToUserInfoMap[secondary1].clock >=
      replicaToUserInfoMap[secondary2].clock
        ? [secondary1, secondary2]
        : [secondary2, secondary1]
    return {
      newPrimary,
      newSecondary1: currentHealthySecondary,
      newSecondary2: newReplicaNode,
      issueReconfig: _isReconfigEnabled(
        enabledReconfigModes,
        RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key
      ),
      reconfigType: RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key
    }
  }

  // If one secondary is unhealthy, select a new secondary
  const currentHealthySecondary = !unhealthyReplicasSet.has(secondary1)
    ? secondary1
    : secondary2
  return {
    newPrimary: primary,
    newSecondary1: currentHealthySecondary,
    newSecondary2: newReplicaNode,
    issueReconfig: _isReconfigEnabled(
      enabledReconfigModes,
      RECONFIG_MODES.ONE_SECONDARY.key
    ),
    reconfigType: RECONFIG_MODES.ONE_SECONDARY.key
  }
}

/**
 * Determines new replica set when two nodes in the current replica set are unhealthy.
 * @param {*} primary user's current primary endpoint
 * @param {*} secondary1 user's current first secondary endpoint
 * @param {*} secondary2 user's current second secondary endpoint
 * @param {*} unhealthyReplicasSet a set of endpoints of unhealthy replica set nodes
 * @param {*} newReplicaNodes array of endpoints of nodes that will replace the unhealthy nodes
 * @returns reconfig info to update the user's replica set to replace the 1 unhealthy nodes
 */
const _determineNewReplicaSetWhenTwoNodesAreUnhealthy = (
  primary: string,
  secondary1: string,
  secondary2: string,
  unhealthyReplicasSet: Set<string>,
  newReplicaNodes: string[],
  enabledReconfigModes: string[]
) => {
  // If primary + secondary is unhealthy, use other healthy secondary as primary and 2 random secondaries
  if (unhealthyReplicasSet.has(primary)) {
    return {
      newPrimary: !unhealthyReplicasSet.has(secondary1)
        ? secondary1
        : secondary2,
      newSecondary1: newReplicaNodes[0],
      newSecondary2: newReplicaNodes[1],
      issueReconfig: _isReconfigEnabled(
        enabledReconfigModes,
        RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key
      ),
      reconfigType: RECONFIG_MODES.PRIMARY_AND_OR_SECONDARIES.key
    }
  }

  // If both secondaries are unhealthy, keep original primary and select two random secondaries
  return {
    newPrimary: primary,
    newSecondary1: newReplicaNodes[0],
    newSecondary2: newReplicaNodes[1],
    issueReconfig: _isReconfigEnabled(
      enabledReconfigModes,
      RECONFIG_MODES.MULTIPLE_SECONDARIES.key
    ),
    reconfigType: RECONFIG_MODES.MULTIPLE_SECONDARIES.key
  }
}

/**
 * Select a random node that is not from the current replica set. Make sure the random node does not have any
 * existing user data for the current user. If there is pre-existing data in the randomly selected node, keep
 * searching for a node that has no state.
 *
 * If an insufficient amount of new replica set nodes are chosen, this method will throw an error.
 * @param {Set<string>} healthyReplicaSet a set of the healthy replica set endpoints
 * @param {number} numberOfUnhealthyReplicas the number of unhealthy replica set endpoints
 * @param {string[]} healthyNodes an array of all the healthy nodes available on the network
 * @param {string} wallet the wallet of the current user
 * @param {Object} logger a logger that can be filtered on jobName and jobId
 * @returns {string[]} a string[] of the new replica set nodes
 */
const _selectRandomReplicaSetNodes = async (
  healthyReplicaSet: Set<string>,
  numberOfUnhealthyReplicas: number,
  healthyNodes: string[],
  wallet: string,
  logger: Logger
): Promise<string[]> => {
  const logStr = `[_selectRandomReplicaSetNodes] wallet=${wallet} healthyReplicaSet=[${[
    ...healthyReplicaSet
  ]}] numberOfUnhealthyReplicas=${numberOfUnhealthyReplicas} healthyNodes=${[
    ...healthyNodes
  ]} ||`

  const newReplicaNodesSet = new Set<string>()
  let selectNewReplicaSetAttemptCounter = 0
  while (
    newReplicaNodesSet.size < numberOfUnhealthyReplicas &&
    selectNewReplicaSetAttemptCounter++ < MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS
  ) {
    const randomHealthyNode = _.sample(healthyNodes)

    // If node is already present in new replica set or is part of the exiting replica set, keep finding a unique healthy node
    if (
      newReplicaNodesSet.has(randomHealthyNode) ||
      healthyReplicaSet.has(randomHealthyNode)
    )
      continue

    // Check to make sure that the newly selected secondary does not have existing user state
    try {
      const clockValue = await retrieveClockValueForUserFromReplica(
        randomHealthyNode,
        wallet
      )
      if (clockValue === -1) {
        newReplicaNodesSet.add(randomHealthyNode)
      } else if (clockValue === 0) {
        newReplicaNodesSet.add(randomHealthyNode)
        logger.warn(
          `${logStr} Found a node with clock value of 0, selecting anyway`
        )
      }
    } catch (e: any) {
      // Something went wrong in checking clock value. Reselect another secondary.
      logger.error(`${logStr} ${e.message}`)
    }
  }

  if (newReplicaNodesSet.size < numberOfUnhealthyReplicas) {
    throw new Error(
      `${logStr} Not enough healthy nodes found to issue new replica set after ${MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS} attempts`
    )
  }

  return Array.from(newReplicaNodesSet)
}

type IssueUpdateReplicaSetResult = {
  errorMsg: string
  issuedReconfig: boolean
  syncJobsToEnqueue: IssueSyncRequestJobParams[]
}
/**
 * 1. Write new replica set to URSM
 * 2. Return sync jobs that can be enqueued to write data to new replica set
 *
 * @param {number} userId user id to issue a reconfiguration for
 * @param {string} wallet wallet address of user id
 * @param {string} primary endpoint of the current primary node on replica set
 * @param {string} secondary1 endpoint of the current first secondary node on replica set
 * @param {string} secondary2 endpoint of the current second secondary node on replica set
 * @param {Object} newReplicaSet {newPrimary, newSecondary1, newSecondary2, issueReconfig, reconfigType}
 * @param {Object} logger a logger that can be filtered on jobName and jobId
 */
const _issueUpdateReplicaSetOp = async (
  userId: number,
  wallet: string,
  primary: string,
  secondary1: string,
  secondary2: string,
  newReplicaSet: NewReplicaSet,
  audiusLibs: any,
  logger: Logger
): Promise<IssueUpdateReplicaSetResult> => {
  const response: IssueUpdateReplicaSetResult = {
    errorMsg: '',
    issuedReconfig: false,
    syncJobsToEnqueue: []
  }
  let newReplicaSetEndpoints: string[] = []
  const newReplicaSetSPIds = []
  try {
    const {
      newPrimary,
      newSecondary1,
      newSecondary2,
      issueReconfig,
      reconfigType
    } = newReplicaSet
    newReplicaSetEndpoints = [
      newPrimary || '',
      newSecondary1 || '',
      newSecondary2 || ''
    ].filter(Boolean)

    logger.info(
      `[_issueUpdateReplicaSetOp] userId=${userId} wallet=${wallet} newReplicaSetEndpoints=${JSON.stringify(
        newReplicaSetEndpoints
      )}`
    )

    // If snapback is not enabled, Log reconfig op without issuing.
    if (!issueReconfig) {
      logger.info(
        `[_issueUpdateReplicaSetOp] Reconfig [DISABLED]: userId=${userId} wallet=${wallet} old replica set=[${primary},${secondary1},${secondary2}] | new replica set=[${newReplicaSetEndpoints}] | reconfig type=[${reconfigType}]`
      )
      return response
    }

    // Create new array of replica set spIds and write to URSM
    for (const endpt of newReplicaSetEndpoints) {
      // If for some reason any node in the new replica set is not registered on chain as a valid SP and is
      // selected as part of the new replica set, do not issue reconfig
      if (!CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap()[endpt]) {
        response.errorMsg = `[_issueUpdateReplicaSetOp] userId=${userId} wallet=${wallet} unable to find valid SPs from new replica set=[${newReplicaSetEndpoints}] | new replica set spIds=[${newReplicaSetSPIds}] | reconfig type=[${reconfigType}] | endpointToSPIdMap=${JSON.stringify(
          CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap()
        )} | endpt=${endpt}. Skipping reconfig.`
        logger.error(response.errorMsg)
        return response
      }
      newReplicaSetSPIds.push(
        CNodeToSpIdMapManager.getCNodeEndpointToSpIdMap()[endpt]
      )
    }

    // Submit chain tx to update replica set
    const startTimeMs = Date.now()
    try {
      await audiusLibs.contracts.UserReplicaSetManagerClient.updateReplicaSet(
        userId,
        newReplicaSetSPIds[0], // primary
        newReplicaSetSPIds.slice(1) // [secondary1, secondary2]
      )
      const timeElapsedMs = Date.now() - startTimeMs
      logger.info(
        `[_issueUpdateReplicaSetOp] updateReplicaSet took ${timeElapsedMs}ms for userId=${userId} wallet=${wallet} `
      )

      response.issuedReconfig = true
    } catch (e: any) {
      const timeElapsedMs = Date.now() - startTimeMs
      throw new Error(
        `UserReplicaSetManagerClient.updateReplicaSet() Failed in ${timeElapsedMs}ms - Error ${e.message}`
      )
    }

    // Enqueue a sync from new primary to new secondary1. If there is no diff, then this is a no-op.
    const { duplicateSyncReq, syncReqToEnqueue: syncToEnqueueToSecondary1 } =
      getNewOrExistingSyncReq({
        userWallet: wallet,
        primaryEndpoint: newPrimary,
        secondaryEndpoint: newSecondary1,
        syncType: SyncType.Recurring,
        syncMode: SYNC_MODES.SyncSecondaryFromPrimary
      })
    if (!_.isEmpty(duplicateSyncReq)) {
      logger.warn(
        `[_issueUpdateReplicaSetOp] Reconfig had duplicate sync request to secondary1: ${duplicateSyncReq}`
      )
    } else if (!_.isEmpty(syncToEnqueueToSecondary1)) {
      response.syncJobsToEnqueue.push(syncToEnqueueToSecondary1)
    }

    // Enqueue a sync from new primary to new secondary2. If there is no diff, then this is a no-op.
    const {
      duplicateSyncReq: duplicateSyncReq2,
      syncReqToEnqueue: syncToEnqueueToSecondary2
    } = getNewOrExistingSyncReq({
      userWallet: wallet,
      primaryEndpoint: newPrimary,
      secondaryEndpoint: newSecondary2,
      syncType: SyncType.Recurring,
      syncMode: SYNC_MODES.SyncSecondaryFromPrimary
    })
    if (!_.isEmpty(duplicateSyncReq2)) {
      logger.warn(
        `[_issueUpdateReplicaSetOp] Reconfig had duplicate sync request to secondary2: ${duplicateSyncReq2}`
      )
    } else if (!_.isEmpty(syncToEnqueueToSecondary2)) {
      response.syncJobsToEnqueue.push(syncToEnqueueToSecondary2)
    }

    logger.info(
      `[_issueUpdateReplicaSetOp] Reconfig [SUCCESS]: userId=${userId} wallet=${wallet} old replica set=[${primary},${secondary1},${secondary2}] | new replica set=[${newReplicaSetEndpoints}] | reconfig type=[${reconfigType}]`
    )
  } catch (e: any) {
    response.errorMsg = `[_issueUpdateReplicaSetOp] Reconfig [ERROR]: userId=${userId} wallet=${wallet} old replica set=[${primary},${secondary1},${secondary2}] | new replica set=[${newReplicaSetEndpoints}] | Error: ${e.toString()}`
    logger.error(response.errorMsg)
    return response
  }

  return response
}

/**
 * Given the current mode, determine if reconfig is enabled
 * @param
 * @param {string} mode current mode of the state machine
 * @returns boolean of whether or not reconfig is enabled
 */
const _isReconfigEnabled = (enabledReconfigModes: string[], mode: string) => {
  if (mode === RECONFIG_MODES.RECONFIG_DISABLED.key) return false
  return enabledReconfigModes.includes(mode)
}
