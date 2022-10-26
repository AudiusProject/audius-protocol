const models = require('../models')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseServerError
} = require('../apiHelpers')
const { logger } = require('../logging')
const { Op } = require('sequelize')
const { Validator } = require('jsonschema')
const authMiddleware = require('../authMiddleware')

const requestSchema = {
  id: '/transaction_metadata_post',
  type: 'object',
  properties: {
    transactionSignature: { type: 'string' },
    metadata: { $ref: '/PurchaseMetadata' }
  },
  additionalProperties: false,
  required: ['transactionSignature', 'metadata']
}

const purchaseMetadataSchema = {
  id: '/PurchaseMetadata',
  type: 'object',
  properties: {
    discriminator: { type: 'string' },
    usd: { type: 'string' },
    sol: { type: 'string' },
    audio: { type: 'string' },
    setupTransactionId: { type: ['string', 'null'] },
    swapTransactionId: { type: 'string' },
    cleanupTransactionId: { type: ['string', 'null'] },
    purchaseTransactionId: { type: 'string' }
  },
  additionalProperties: false,
  required: [
    'discriminator',
    'usd',
    'sol',
    'audio',
    'swapTransactionId',
    'purchaseTransactionId'
  ]
}

const validator = new Validator()
validator.addSchema(purchaseMetadataSchema)

module.exports = function (app) {
  app.post(
    '/transaction_metadata',
    authMiddleware,
    handleResponse(async (req, res, next) => {
      const userId = req.user.blockchainUserId
      const validationResult = validator.validate(req.body, requestSchema)
      if (!validationResult.valid) {
        logger.error(JSON.stringify(validationResult.errors))
        return errorResponseBadRequest()
      }
      const { transactionSignature, metadata } = req.body
      try {
        await models.UserBankTransactionMetadata.create({
          userId,
          transactionSignature,
          metadata
        })
        return successResponse()
      } catch (e) {
        logger.info(e, 'Error saving user bank transaction metadata')
        return errorResponseServerError('Something went wrong!')
      }
    })
  )

  app.get(
    '/transaction_metadata',
    authMiddleware,
    handleResponse(async (req, res, next) => {
      const userId = req.user.blockchainUserId
      const { id } = req.query
      if (!id) {
        return errorResponseBadRequest("Missing 'id' query param")
      }
      const ids = typeof id === 'string' ? [id] : id
      if (!ids.every((id) => typeof id === 'string')) {
        return errorResponseBadRequest(
          'Invalid transaction signatures specified'
        )
      }
      const metadatas = await models.UserBankTransactionMetadata.findAll({
        where: {
          userId,
          transactionSignature: {
            [Op.in]: ids
          }
        }
      })
      return successResponse(metadatas)
    })
  )
}
