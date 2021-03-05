const express = require('express')

const { serviceRegistry } = require('../../serviceRegistry')
const {
  successResponse,
  handleResponse,
  handleApiError
} = require('../../apiHelpers')
const { respondToURSMRequestForSignature } = require('./URSMRegistrationComponentService')

const router = express.Router()

// Controllers

/**
 * Controller for `/ursm_request_for_signature` route
 * Calls `URSMRegistrationComponentService
 */
const respondToURSMRequestForProposalController = async (req) => {
  const { spID, timestamp, signature } = req.query

  const logger = req.logger

  try {
    const response = await respondToURSMRequestForSignature(serviceRegistry, logger, spID, timestamp, signature)
    return successResponse(response)
  } catch (e) {
    return handleApiError(e)
  }
}

// Routes

/**
 * TODO rate limit route (?)
 */
router.get('/ursm_request_for_signature', handleResponse(respondToURSMRequestForProposalController))

module.exports = router
