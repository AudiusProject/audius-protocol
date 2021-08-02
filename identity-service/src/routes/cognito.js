const {
  handleResponse,
  successResponse,
  errorResponseServerError
} = require('../apiHelpers')
const { logger } = require('../logging')
const models = require('../models')
const authMiddleware = require('../authMiddleware')
const cognitoFlowMiddleware = require('../cognitoFlowMiddleware')
const { sign } = require('../utils/cognitoHelpers')

module.exports = function (app) {
  app.get('/cognito_signature', authMiddleware, handleResponse(async (req) => {
    const { walletAddress, handle } = req.user
    logger.info(`cognito_signature | Creating signature for: wallet '${walletAddress}', handle '${handle}'`)
    try {
      const signature = sign(handle)
      return successResponse({ signature })
    } catch (e) {
      logger.error(e)
      return errorResponseServerError({
        message: e.message
      })
    }
  }))

  /**
   * doc for webhook receiver implementation: https://docs.cognitohq.com/guides
   * cognito's webhook post request body will have the following format
   *
   * {
   *     "id": "some-id",
   *     "timestamp": "some-timestamp",
   *     "event": "flow_session.status.updated", // could be another event but we mostly care about flow_session.status.updated
   *     "data": {
   *         "object": "flow_session",
   *         "id": "some-other-id",
   *         "status": "failed", // or 'success'
   *         "step": null, // or some step if event is flow_session.step.updated
   *         "customer_reference": "some-customer-unique-persistent-id-eg-handle",
   *         "_meta": "This API format is not v1.0 and is subject to change."
   *     },
   *     "environment": "live" // or 'sandbox'
   * }
   */
  app.post('/cognito_webhook/flow', cognitoFlowMiddleware, handleResponse(async (req) => {
    const { id, event, data } = req.body

    // if event is not of type status, meaning the event denotes of a step in the flow, but not the completion
    // then return 200 without further processing
    if (event !== 'flow_session.status.updated') return successResponse({})

    const { id: sessionId, customer_reference: handle, status } = data

    try {
      // save cognito flow for user
      logger.info(`Saving cognito flow result for user with handle '${handle}' (status: '${status}')`)
      await models.CognitoFlows.create({
        id,
        sessionId,
        handle,
        status,
        // score of 1 if 'success', otherwise 0
        score: Number(status === 'success')
      })

      // cognito flow requires the receiver to respond with 200, otherwise it'll retry with exponential backoff
      return successResponse({})
    } catch (err) {
      console.error(err)
      return errorResponseServerError(err.message)
    }
  }))
}
