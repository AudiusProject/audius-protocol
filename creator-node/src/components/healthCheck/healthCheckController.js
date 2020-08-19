const express = require('express')
const { handleResponse, successResponse } = require('../../apiHelpers')
const { healthCheck } = require('./healthCheckComponentService')
const { serviceRegistry } = require('../../serviceRegistry')

const router = express.Router()

// Controllers

/** Controller for `health_check` route, calls
 * `healthCheckComponentService`.
 */
const healthCheckController = async () => {
  const response = healthCheck(serviceRegistry)
  return successResponse(response)
}

// Routes

router.get('/health_check', handleResponse(healthCheckController))

module.exports = router
