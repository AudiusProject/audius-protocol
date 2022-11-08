const express = require('express')

const {
  handleResponse,
  successResponse,
  handleResponseWithHeartbeat,
  errorResponseServerError,
  errorResponseBadRequest
} = require('../../apiHelpers')
const {
  healthCheck,
  healthCheckDuration,
  configCheck
} = require('./healthCheckComponentService')
const { syncHealthCheck } = require('./syncHealthCheckComponentService')
const { serviceRegistry } = require('../../serviceRegistry')
const { getMonitors } = require('../../monitors/monitors')
const TranscodingQueue = require('../../TranscodingQueue')
const { ensureValidSPMiddleware } = require('../../middlewares')
const config = require('../../config')

const MONITOR_STATE_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS = config.get(
  'monitorStateJobLastSuccessfulRunDelayMs'
)
const FIND_SYNC_REQUESTS_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS = config.get(
  'findSyncRequestsJobLastSuccessfulRunDelayMs'
)
const FIND_REPLICA_SET_UPDATES_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS =
  config.get('findReplicaSetUpdatesJobLastSuccessfulRunDelayMs')

/**
 * Controller for `health_check` route, calls
 * `healthCheckComponentService`.
 */
const healthCheckController = async (req) => {
  const { randomBytesToSign, enforceStateMachineQueueHealth } = req.query

  const logger = req.logger
  const response = await healthCheck(
    serviceRegistry,
    logger,
    getMonitors,
    TranscodingQueue.getTranscodeQueueJobs,
    TranscodingQueue.isAvailable,
    randomBytesToSign
  )

  // Record prometheus storage size & storage used metrics from health check response (computed by monitoring queue)
  const prometheusRegistry = req.app.get('serviceRegistry').prometheusRegistry
  const storagePathSizeMetric = prometheusRegistry.getMetric(
    prometheusRegistry.metricNames.STORAGE_PATH_SIZE_BYTES
  )
  storagePathSizeMetric.set({ type: 'total' }, response.storagePathSize)
  storagePathSizeMetric.set({ type: 'used' }, response.storagePathUsed)

  if (enforceStateMachineQueueHealth) {
    const { stateMachineJobs } = response
    const {
      latestMonitorStateJobSuccess,
      latestFindSyncRequestsJobSuccess,
      latestFindReplicaSetUpdatesJobSuccess
    } = stateMachineJobs
    const stateMachineErrors = []

    // Enforce time since last successful monitor-state job
    if (latestMonitorStateJobSuccess) {
      response.stateMachineJobs.monitorStateJobLastSuccessfulRunDelayMs =
        MONITOR_STATE_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS
      const monitorStateDelta =
        Date.now() - new Date(latestMonitorStateJobSuccess).getTime()
      if (
        monitorStateDelta > MONITOR_STATE_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS
      ) {
        stateMachineErrors.push(
          `monitor-state job not healthy - last successful run ${monitorStateDelta}ms ago not within healthy threshold of ${MONITOR_STATE_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS}ms`
        )
      }
    }

    // Enforce time since last successful find-sync-requests job
    if (latestFindSyncRequestsJobSuccess) {
      response.stateMachineJobs.findSyncRequestsJobLastSuccessfulRunDelayMs =
        FIND_SYNC_REQUESTS_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS
      const findSyncRequestsDelta =
        Date.now() - new Date(latestFindSyncRequestsJobSuccess).getTime()
      if (
        findSyncRequestsDelta >
        FIND_SYNC_REQUESTS_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS
      ) {
        stateMachineErrors.push(
          `find-sync-requests job not healthy - last successful run ${findSyncRequestsDelta}ms ago not within healthy threshold of ${FIND_SYNC_REQUESTS_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS}ms`
        )
      }
    }

    // Enforce time since last successful find-replica-set-updates job
    if (latestFindReplicaSetUpdatesJobSuccess) {
      response.stateMachineJobs.findReplicaSetUpdatesJobLastSuccessfulRunDelayMs =
        FIND_REPLICA_SET_UPDATES_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS
      const findReplicaSetUpdatesDelta =
        Date.now() - new Date(latestFindReplicaSetUpdatesJobSuccess).getTime()
      if (
        findReplicaSetUpdatesDelta >
        FIND_REPLICA_SET_UPDATES_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS
      ) {
        stateMachineErrors.push(
          `find-replica-set-updates job not healthy - last successful run ${findReplicaSetUpdatesDelta}ms ago not within healthy threshold of ${FIND_REPLICA_SET_UPDATES_JOB_MAX_LAST_SUCCESSFUL_RUN_DELAY_MS}ms`
        )
      }
    }

    // Return errors
    if (stateMachineErrors.length) {
      return errorResponseServerError(JSON.stringify(stateMachineErrors))
    }
  }

  if (config.get('isReadOnlyMode')) {
    return errorResponseServerError(response)
  }
  return successResponse(response)
}

/**
 * Controller for `health_check/sync` route, calls
 * syncHealthCheckController
 */
const syncHealthCheckController = async (req) => {
  const response = await syncHealthCheck(serviceRegistry)

  const prometheusRegistry = req.app.get('serviceRegistry').prometheusRegistry
  const syncQueueJobsTotalMetric = prometheusRegistry.getMetric(
    prometheusRegistry.metricNames.SYNC_QUEUE_JOBS_TOTAL_GAUGE
  )
  syncQueueJobsTotalMetric.set(
    { status: 'manual_waiting' },
    response.manualWaitingCount
  )
  syncQueueJobsTotalMetric.set(
    { status: 'recurring_waiting' },
    response.recurringWaitingCount
  )

  return successResponse(response)
}

/**
 * Controller for health_check/duration route
 * Calls healthCheckComponentService
 */
const healthCheckDurationController = async (_req) => {
  const response = await healthCheckDuration()
  return successResponse(response)
}

/**
 * Controller for `health_check/network` route
 *
 * Call a discovery node to make sure network egress and ingress is correct
 */
const healthCheckNetworkController = async (req) => {
  const { libs } = serviceRegistry
  const userId = parseInt(req.query.userId, 10)

  if (!userId) return errorResponseBadRequest('Please pass in valid userId')

  const user = (await libs.User.getUsers(1, 0, [userId]))[0]

  return successResponse({
    user
  })
}

const configCheckController = async (_req) => {
  const configs = configCheck()
  return successResponse({ ...configs })
}

// Routes

const router = express.Router()

// TODO once all calls to /health_check/verbose are removed, can remove
router.get(
  ['/health_check', '/health_check/verbose'],
  handleResponse(healthCheckController)
)
router.get('/health_check/sync', handleResponse(syncHealthCheckController))
router.get(
  '/health_check/duration',
  ensureValidSPMiddleware,
  handleResponse(healthCheckDurationController)
)
router.get(
  '/health_check/duration/heartbeat',
  ensureValidSPMiddleware,
  handleResponseWithHeartbeat(healthCheckDurationController)
)
router.get(
  '/health_check/network',
  handleResponse(healthCheckNetworkController)
)
router.get('/config_check', handleResponse(configCheckController))

module.exports = router
