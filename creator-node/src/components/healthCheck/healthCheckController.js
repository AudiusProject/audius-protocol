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
 * Controller for health_check/duration route
 * Calls healthCheckCOmponentService
 */
 const healthCheckDurationController = async (req) => {
  let { timestamp, randomBytes, signature } = req.query
  console.log(`\n`)
  console.log(`Received timestamp: ${timestamp}`)
  console.log(`Received randomBytes: ${randomBytes}`)
  console.log(`Received signature: ${signature}`)
  console.log(`\n`)
  // TODO: Time limit signature
  return successResponse({ timestamp, randomBytes, signature })
}

// Routes

router.get('/health_check', handleResponse(healthCheckController))
router.get('/health_check/sync', handleResponse(syncHealthCheckController))

router.get('/health_check/duration', handleResponse(healthCheckDurationController))

module.exports = router
