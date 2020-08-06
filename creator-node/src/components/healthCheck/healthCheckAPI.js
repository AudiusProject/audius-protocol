const express = require('express')
const { handleResponse, successResponse } = require('../../apiHelpers')
const { healthCheck } = require('./healthCheck')

const router = express.Router()

// Controllers

const healthCheckController = async (req) => {
  const libs = req.app.get('audiusLibs')
  const response = healthCheck({ libs })
  return successResponse(response)
}

// Routes

router.get('/health_check/test', handleResponse(healthCheckController))

module.exports = router
