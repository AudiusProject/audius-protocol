const { sendResponse, errorResponseBadRequest } = require('./apiHelpers')
const { isWebhookValid } = require('./utils/cognitoHelpers')

// set a maximum allowed time drift between the flow completion and
// the webhook transmission by cognito
// this is so that past webhooks have a limited time window to be sent
// https://docs.cognitohq.com/guides#receiving-webhooks
// cognito should send the webhook soon after a user completes the flow
const MAX_TIME_DRIFT_MILLISECONDS = 15 * 60 * 1000 // fifteen minutes

/**
 * handle incoming cognito flow webhook
 * webhook sent by cognito is signed
 * we need to verify the signature to make sure request is not forged
 * also we make sure timestamp is within acceptable time range
 */
async function cognitoFlowMiddleware (req, res, next) {
  const { headers, url } = req

  if (!isWebhookValid(headers, url)) {
    const errorResponse = errorResponseBadRequest(
      '[Error]: The cognito flow webhook is invalid.'
    )
    return sendResponse(req, res, errorResponse)
  }

  const timeDifferenceMilliseconds =
  Date.now() - new Date(headers['date']).getTime()
  if (timeDifferenceMilliseconds > MAX_TIME_DRIFT_MILLISECONDS) {
    const errorResponse = errorResponseBadRequest(
      '[Error]: The cognito flow webhook timestamp is too old.'
    )
    return sendResponse(req, res, errorResponse)
  }

  next()
}

module.exports = cognitoFlowMiddleware
