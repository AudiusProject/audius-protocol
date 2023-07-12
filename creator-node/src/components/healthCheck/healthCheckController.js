const os = require('os')
const express = require('express')
const {
  handleResponse,
  successResponse,
  handleResponseWithHeartbeat,
  errorResponseServerError,
  errorResponseBadRequest
} = require('../../apiHelpers')
const {
  healthCheckVerbose,
  healthCheckDuration,
  configCheck
} = require('./healthCheckComponentService')
const { serviceRegistry } = require('../../serviceRegistry')
const { getMonitors } = require('../../monitors/monitors')
const TranscodingQueue = require('../../TranscodingQueue')

const { ensureValidSPMiddleware } = require('../../middlewares')

const config = require('../../config')

const path = require('path')
const versionInfo = require(path.join(process.cwd(), '.version.json'))

const router = express.Router()

const numberOfCPUs = os.cpus().length

/**
 * Controller for `health_check/sync` route, calls
 * syncHealthCheckController
 */
const syncHealthCheckController = async (_req) => {
  return successResponse({ message: 'route is deprecated' })
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
 * Controller for `health_check/verbose` route
 * Calls `healthCheckComponentService`.
 *
 * @todo Add disk usage, current load, and/or node details to response.
 * Will be used for cnode selection.
 */
const healthCheckVerboseController = async (req) => {
  const AsyncProcessingQueue =
    req.app.get('serviceRegistry').asyncProcessingQueue

  const logger = req.logger
  const healthCheckResponse = await healthCheckVerbose(
    serviceRegistry,
    logger,
    getMonitors,
    numberOfCPUs,
    TranscodingQueue.getTranscodeQueueJobs,
    TranscodingQueue.isAvailable,
    AsyncProcessingQueue.getAsyncProcessingQueueJobs
  )

  if (config.get('isReadOnlyMode')) {
    return errorResponseServerError(healthCheckResponse)
  } else {
    return successResponse(healthCheckResponse)
  }
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

router.get('/health_check', async (_req, res) => {
  res.status(200).send({
    ...versionInfo,
    selectedDiscoveryProvider:
      serviceRegistry?.libs?.discoveryProvider?.discoveryProviderEndpoint ||
      'none'
  })
})
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
  '/health_check/verbose',
  handleResponse(healthCheckVerboseController)
)
router.get(
  '/health_check/network',
  handleResponse(healthCheckNetworkController)
)
router.get('/config_check', handleResponse(configCheckController))

module.exports = router
