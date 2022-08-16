import type Logger from 'bunyan'
import type { DecoratedJobParams, DecoratedJobReturnValue } from '../types'
import type {
  FindReplicaSetUpdateJobParams,
  FindSyncRequestsJobParams,
  MonitorStateJobParams,
  MonitorStateJobReturnValue,
  ReplicaToAllUserInfoMaps,
  StateMonitoringUser,
  UserSecondarySyncMetricsMap
} from './types'
import type { SpanContext } from '@opentelemetry/api'
import { SpanStatusCode } from '@opentelemetry/api'
import { SemanticAttributes } from '@opentelemetry/semantic-conventions'

// eslint-disable-next-line import/no-unresolved
import { QUEUE_NAMES } from '../stateMachineConstants'

import config from '../../../config'
import NodeHealthManager from '../CNodeHealthManager'
import {
  getNodeUsers,
  buildReplicaSetNodesToUserWalletsMap,
  computeUserSecondarySyncSuccessRatesMap
} from './stateMonitoringUtils'
import { retrieveUserInfoFromReplicaSet } from '../stateMachineUtils'
import { getActiveSpan, instrumentTracing } from 'utils/tracing'

// Number of users to process each time monitor-state job processor is called
const USERS_PER_JOB = config.get('snapbackUsersPerJob')
const THIS_CNODE_ENDPOINT = config.get('creatorNodeEndpoint')

type Decision = {
  stage: string
  data?: any
  time: number
  duration?: number
  fullDuration?: number
}

/**
 * Processes a job to monitor the current state of `USERS_PER_JOB` users.
 * Returns state data for the slice of users processed and the Content Nodes affiliated with them.
 *
 * @param {Object} param job data
 * @param {Object} param.logger the logger that can be filtered by jobName and jobId
 * @param {number} param.lastProcessedUserId the highest ID of the user that was most recently processed
 * @param {string} param.discoveryNodeEndpoint the IP address / URL of a Discovery Node to make requests to
 * @return {Object} object containing an array of jobs to add to the state monitoring queue
 */
const monitorState = async ({
  logger,
  lastProcessedUserId,
  discoveryNodeEndpoint,
  parentSpanContext
}: DecoratedJobParams<MonitorStateJobParams>): Promise<
  DecoratedJobReturnValue<MonitorStateJobReturnValue>
> => {
  const span = getActiveSpan()

  // Record all stages of this function along with associated information for use in logging
  const decisionTree: Decision[] = []
  _addToDecisionTree(
    decisionTree,
    'BEGIN monitor-state job processor',
    logger,
    {
      lastProcessedUserId,
      discoveryNodeEndpoint,
      THIS_CNODE_ENDPOINT,
      USERS_PER_JOB
    }
  )

  let users: StateMonitoringUser[] = []
  let unhealthyPeers = new Set<string>()
  let replicaToAllUserInfoMaps: ReplicaToAllUserInfoMaps = {}
  let userSecondarySyncMetricsMap: UserSecondarySyncMetricsMap = {}
  try {
    try {
      users = await getNodeUsers(
        discoveryNodeEndpoint,
        THIS_CNODE_ENDPOINT,
        lastProcessedUserId,
        USERS_PER_JOB
      )

      _addToDecisionTree(decisionTree, 'getNodeUsers Success', logger, {
        usersLength: users?.length
      })
    } catch (e: any) {
      span?.recordException(e)
      // Make the next job try again instead of looping back to userId 0
      users = [
        {
          user_id: lastProcessedUserId,
          primary: '',
          secondary1: '',
          secondary2: '',
          primarySpID: 0,
          secondary1SpID: 0,
          secondary2SpID: 0,
          wallet: ''
        }
      ]

      logger.error(e.stack)
      _addToDecisionTree(decisionTree, 'getNodeUsers Error', logger, {
        error: e.message
      })
      span?.end()
      throw new Error(
        `monitor-state job processor getNodeUsers Error: ${e.toString()}`
      )
    }

    try {
      unhealthyPeers = await NodeHealthManager.getUnhealthyPeers(users)
      _addToDecisionTree(
        decisionTree,
        'getUnhealthyPeers Success',
        logger,
        {
          unhealthyPeerSetLength: unhealthyPeers?.size,
          unhealthyPeers: Array.from(unhealthyPeers)
        }
      )
    } catch (e: any) {
      span?.recordException(e)
      logger.error(e.stack)
      _addToDecisionTree(
        decisionTree,
        'monitor-state job processor getUnhealthyPeers Error',
        logger,
        { error: e.message }
      )
      throw new Error(
        `monitor-state job processor getUnhealthyPeers Error: ${e.toString()}`
      )
    }

    // Build map of <replica set node : [array of wallets that are on this replica set node]>
    const replicaSetNodesToUserWalletsMap =
      buildReplicaSetNodesToUserWalletsMap(users)
    _addToDecisionTree(
      decisionTree,
      'buildReplicaSetNodesToUserWalletsMap Success',
      logger,
      {
        numReplicaSetNodes: Object.keys(replicaSetNodesToUserWalletsMap)
          ?.length
      }
    )

    // Retrieve user info for all users and their current replica sets
    try {
      const retrieveUserInfoResp = await retrieveUserInfoFromReplicaSet(
        replicaSetNodesToUserWalletsMap
      )
      replicaToAllUserInfoMaps =
        retrieveUserInfoResp.replicaToAllUserInfoMaps

      // Mark peers as unhealthy if they were healthy before but failed to return a clock value
      unhealthyPeers = new Set([
        ...unhealthyPeers,
        ...retrieveUserInfoResp.unhealthyPeers
      ])

      _addToDecisionTree(
        decisionTree,
        'retrieveUserInfoFromReplicaSet Success',
        logger
      )
    } catch (e: any) {
      span?.recordException(e)
      span?.setStatus({ code: SpanStatusCode.ERROR })
      logger.error(e.stack)
      _addToDecisionTree(
        decisionTree,
        'retrieveUserInfoFromReplicaSet Error',
        logger,
        { error: e.message }
      )
      throw new Error(
        'monitor-state job processor retrieveUserInfoFromReplicaSet Error'
      )
    }

    // Retrieve success metrics for all users syncing to their secondaries
    try {
      userSecondarySyncMetricsMap =
        await computeUserSecondarySyncSuccessRatesMap(users)
      _addToDecisionTree(
        decisionTree,
        'computeUserSecondarySyncSuccessRatesMap Success',
        logger,
        {
          userSecondarySyncMetricsMapLength: Object.keys(
            userSecondarySyncMetricsMap
          )?.length
        }
      )
    } catch (e: any) {
      span?.recordException(e)
      span?.setStatus({ code: SpanStatusCode.ERROR })
      logger.error(e.stack)
      _addToDecisionTree(
        decisionTree,
        'computeUserSecondarySyncSuccessRatesMap Error',
        logger,
        { error: e.message }
      )
      throw new Error(
        'monitor-state job processor computeUserSecondarySyncSuccessRatesMap Error'
      )
    }
  } catch (e: any) {
    span?.recordException(e)
    span?.setStatus({ code: SpanStatusCode.ERROR })
    logger.info(`monitor-state job processor ERROR: ${e.toString()}`)
  } finally {
    _addToDecisionTree(
      decisionTree,
      'END monitor-state job processor',
      logger
    )

    // Log decision tree
    _printDecisionTree(decisionTree, logger)
  }

  // The next job should start processing where this one ended or loop back around to the first user
  const lastProcessedUser: { user_id: number } = users[
    users.length - 1
  ] || {
    user_id: 0
  }
  const findSyncRequestsJob: FindSyncRequestsJobParams = {
    users,
    unhealthyPeers: Array.from(unhealthyPeers), // Bull messes up passing a Set
    replicaToAllUserInfoMaps,
    userSecondarySyncMetricsMap,
    parentSpanContext: span?.spanContext()
  }
  const findReplicaSetUpdatesJob: FindReplicaSetUpdateJobParams = {
    users,
    unhealthyPeers: Array.from(unhealthyPeers), // Bull messes up passing a Set
    replicaToAllUserInfoMaps,
    userSecondarySyncMetricsMap,
    parentSpanContext: span?.spanContext()
  }
  const monitorStateJob: MonitorStateJobParams = {
    lastProcessedUserId: lastProcessedUser?.user_id || 0,
    discoveryNodeEndpoint,
    parentSpanContext: span?.spanContext()
  }

  return {
    spanContext: span?.spanContext(),
    jobsToEnqueue: {
      // Enqueue a job to find sync requests that need to be issued for the slice of users we just monitored
      [QUEUE_NAMES.FIND_SYNC_REQUESTS]: [findSyncRequestsJob],
      // Enqueue a job to find sync replica sets that need to be updated for the slice of users we just monitored
      [QUEUE_NAMES.FIND_REPLICA_SET_UPDATES]: [findReplicaSetUpdatesJob],
      // Enqueue another monitor-state job to monitor the next slice of users
      [QUEUE_NAMES.MONITOR_STATE]: [monitorStateJob]
    }
  }
}

const _addToDecisionTree = instrumentTracing({
  fn: (
    decisionTree: Decision[],
    stage: string,
    logger: Logger,
    data = {}
  ) => {
    const obj: Decision = { stage, data, time: Date.now() }

    let logStr = `monitor-state job processor ${stage} - Data ${JSON.stringify(
      data
    )}`

    if (decisionTree.length > 0) {
      // Set duration if both objs have time field
      const lastObj = decisionTree[decisionTree.length - 1]
      if (lastObj && lastObj.time) {
        const duration = obj.time - lastObj.time
        obj.duration = duration
        logStr += ` - Duration ${duration}ms`
      }
    }
    decisionTree.push(obj)

    if (logger) {
      logger.info(logStr)
    }
  }
})

const _printDecisionTree = (decisionTree: Decision[], logger: Logger) => {
  // Compute and record `fullDuration`
  if (decisionTree.length > 2) {
    const startTime = decisionTree[0].time
    const endTime = decisionTree[decisionTree.length - 1].time
    const duration = endTime - startTime
    decisionTree[decisionTree.length - 1].fullDuration = duration
  }
  try {
    logger.info(
      `monitor-state job processor Decision Tree${JSON.stringify(decisionTree)}`
    )
  } catch (e) {
    logger.error(
      `Error printing monitor-state job processor Decision Tree ${decisionTree}`
    )
  }
}

module.exports = async ({ parentSpanContext }: {
  parentSpanContext: SpanContext
}) => instrumentTracing({
  name: 'monitorState.jobProcessor',
  fn: monitorState,
  options: {
    links: [
      {
        context: parentSpanContext
      }
    ],
    attributes: {
      [SemanticAttributes.CODE_FILEPATH]: __filename
    }
  }
})