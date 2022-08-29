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
    swapTransaction: { type: 'string' },
    buyTransaction: { type: 'string' }
  },
  additionalProperties: false,
  required: ['discriminator', 'usd', 'sol', 'audio', 'swapTransaction', 'buyTransaction']
}

const validator = new Validator()
validator.addSchema(purchaseMetadataSchema)

module.exports = function (app) {
  app.post(
    '/transaction_metadata',
    handleResponse(async (req, res, next) => {
      const validationResult = validator.validate(req.body, requestSchema)
      if (!validationResult.valid) {
        logger.error(JSON.stringify(validationResult.errors))
        return errorResponseBadRequest()
      }
      const { transactionSignature, metadata } = req.body
      try {
        await models.UserBankTransactionMetadata.create({
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
    handleResponse(async (req, res, next) => {
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
          transactionSignature: {
            [Op.in]: ids
          }
        }
      })
      return successResponse(metadatas)
    })
  )
}
