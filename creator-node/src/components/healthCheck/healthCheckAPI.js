const express = require('express')
const { handleResponse, successResponse } = require('../../apiHelpers')
const { healthCheck } = require('./healthCheck')
const { serviceRegistry } = require('../../serviceRegistry')

const router = express.Router()

// Controllers

const healthCheckController = async () => {
  const response = healthCheck(serviceRegistry)
  return successResponse(response)
}

// Routes

router.get('/health_check', handleResponse(healthCheckController))

module.exports = router
