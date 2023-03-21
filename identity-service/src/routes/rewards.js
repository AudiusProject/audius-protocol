const express = require('express')
const {
  handleResponse,
  successResponse,
  errorResponseServerError
} = require('../apiHelpers')
const config = require('../config.js')
const { RewardsReporter } = require('../utils/rewardsReporter')

const rewardsRouter = express.Router()

const handleResult = async ({
  status,
  userId,
  challengeId,
  amount,
  error,
  phase,
  reporter,
  specifier,
  reason
}) => {
  switch (status) {
    case 'success':
      await reporter.reportSuccess({ userId, challengeId, amount, specifier })
      break
    case 'failure':
      await reporter.reportFailure({
        userId,
        challengeId,
        amount,
        error,
        phase,
        specifier
      })
      break
    case 'retry':
      await reporter.reportRetry({
        userId,
        challengeId,
        amount,
        error,
        phase,
        specifier
      })
      break
    case 'rejection':
      await reporter.reportAAORejection({
        userId,
        challengeId,
        amount,
        error,
        specifier,
        reason
      })
      break
    default:
      throw new Error('Bad status code')
  }
}

rewardsRouter.post(
  '/attestation_result',
  handleResponse(async (req) => {
    const {
      status,
      userId,
      challengeId,
      amount,
      error,
      phase,
      source,
      specifier,
      reason
    } = req.body
    const reporter = new RewardsReporter({
      successSlackUrl: config.get('successAudioReporterSlackUrl'),
      errorSlackUrl: config.get('errorAudioReporterSlackUrl'),
      source,
      shouldReportAnalytics: false
    })
    try {
      await handleResult({
        status,
        userId,
        challengeId,
        amount,
        error,
        phase,
        reporter,
        specifier,
        reason
      })
      return successResponse()
    } catch (e) {
      return errorResponseServerError(e.message)
    }
  })
)

module.exports = function (app) {
  app.use('/rewards', rewardsRouter)
}
