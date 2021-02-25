const express = require('express')

const {
  successResponse,
  handleResponse,
  handleApiError
} = require('../../apiHelpers')
const { respondToURSMRequestForProposal } = require('./URSMRegistrationComponentService')

const router = express.Router()

// Controllers

/**
 * 
 * @param {*} req 
 */
const respondToURSMRequestForProposalController = async (req) => {
  const { spID, timestamp, signature } = req.query

  const serviceRegistry = req.app.get('serviceRegistry')
  const logger = req.logger

  try {
    const response = await respondToURSMRequestForProposal(serviceRegistry, logger, spID, timestamp, signature)
    return successResponse(response)
  } catch (e) {
    return handleApiError(e)
  }
}

/**
 * NOTE - this is a testing route and will be removed before merge.
 */
/**
 * 
 * @param {*} req 
 */
const submitRFPController = async (req) => {
  const serviceRegistry = req.app.get('serviceRegistry')
  const logger = req.logger
  try {
    await serviceRegistry.URSMService.init()
  } catch (e) {
    logger.error(`INIT ERROR: ${e}`)
  }

  return successResponse('got this far bruh')
}

// Routes

router.get('/ursm_request_for_proposal', handleResponse(respondToURSMRequestForProposalController))
router.get('/submitRFP', handleResponse(submitRFPController))

module.exports = router