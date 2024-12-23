const express = require('express')
const { recoverPersonalSignature } = require('eth-sig-util')

const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponse: formatResponse,
  sendResponse
} = require('../apiHelpers')
const models = require('../models')

const protocolRouter = express.Router()

protocolRouter.get(
  '/:wallet/delegation/minimum',
  handleResponse(async (req, res, next) => {
    const { wallet } = req.params

    const serviceProvider = await models.ProtocolServiceProviders.findOne({
      where: { wallet: wallet.toLowerCase() }
    })

    if (serviceProvider === null) {
      return formatResponse(404, 'Minimum delegation amount not set')
    }

    return successResponse({
      wallet,
      minimumDelegationAmount: serviceProvider.minimumDelegationAmount
    })
  })
)

async function serviceProviderAuthMiddleware(req, res, next) {
  try {
    const encodedDataMessage = req.get('Encoded-Data-Message')
    const signature = req.get('Encoded-Data-Signature')

    if (!encodedDataMessage) throw new Error('[Error]: Encoded data missing')
    if (!signature) throw new Error('[Error]: Encoded data signature missing')

    const wallet = recoverPersonalSignature({
      data: encodedDataMessage,
      sig: signature
    })
    req.authedWallet = wallet
    next()
  } catch (err) {
    req.logger.warn(`${err}`)
    const errorResponse = errorResponseBadRequest('[Error]: ')
    return sendResponse(req, res, errorResponse)
  }
}

protocolRouter.post(
  '/:wallet/delegation/minimum',
  serviceProviderAuthMiddleware,
  handleResponse(async (req, res, next) => {
    const { wallet } = req.params

    if (wallet.toLowerCase() !== req.authedWallet.toLowerCase()) {
      return errorResponseBadRequest(
        `[Error]: Not authenticated, unable to change minimun delegation`
      )
    }

    const { minimumDelegationAmount } = req.body
    if (
      !minimumDelegationAmount ||
      typeof minimumDelegationAmount !== 'string'
    ) {
      return errorResponseBadRequest(
        `Bad Request: Must pass request body field 'minimumDelegationAmount' as string in wei`
      )
    }

    const isNumeric = /^\d+$/.test(minimumDelegationAmount)
    if (!isNumeric) {
      return errorResponseBadRequest(
        `Bad Request: 'minimumDelegationAmount' must be a string consisting of only numbers`
      )
    }

    await models.ProtocolServiceProviders.upsert({
      wallet,
      minimumDelegationAmount
    })

    return successResponse({
      wallet,
      minimumDelegationAmount
    })
  })
)

module.exports = function (app) {
  app.use('/protocol', protocolRouter)
}
