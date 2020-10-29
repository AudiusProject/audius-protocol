const express = require('express')
const { handleResponse, successResponse } = require('../../apiHelpers')
const { healthCheck, healthCheckDuration } = require('./healthCheckComponentService')
const { syncHealthCheck } = require('./syncHealthCheckComponentService')
const { serviceRegistry } = require('../../serviceRegistry')
const { sequelize } = require('../../models')

const router = express.Router()

// Controllers

/**
 * Controller for `health_check` route, calls
 * `healthCheckComponentService`.
 */
const healthCheckController = async (req) => {
  const logger = req.logger
  const response = await healthCheck(serviceRegistry, logger, sequelize)
  return successResponse(response)
}

/**
 * Controller for `health_check/sync` route, calls
 * syncHealthCheckController
 */
const syncHealthCheckController = async () => {
  const response = await syncHealthCheck(serviceRegistry)
  return successResponse(response)
}

/**
 * Controllr for health_check/duration route
 * Calls healthCheckCOmponentService
 */

 const healthCheckDurationController = async () => {
  let { timestamp, randomBytes, signature } = queryParams
  return { timestamp, randomBytes, signature}
  // TODO: Time limit signature
}

// Routes

router.get('/health_check', handleResponse(healthCheckController))
router.get('/health_check/sync', handleResponse(syncHealthCheckController))

router.post('/health_check/duration', handleResponse(healthCheckDurationController))

module.exports = router
