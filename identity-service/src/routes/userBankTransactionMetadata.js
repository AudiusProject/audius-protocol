const models = require('../models')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseServerError
} = require('../apiHelpers')
const { logger } = require('../logging')
const { Op } = require('sequelize')

const requiredPurchaseKeys = {
  discriminator: { type: 'string' },
  usd: { type: 'string' },
  sol: { type: 'string' },
  audio: { type: 'string' },
  swapTransaction: { type: 'string' },
  buyTransaction: { type: 'string' }
}

const validateMetadata = (metadata) => {
  if (!metadata) {
    throw new Error('Missing metadata')
  }
  if (!('discriminator' in metadata)) {
    throw new Error(`Missing discriminator`)
  }
  if (metadata.discriminator === 'PURCHASE_SOL_AUDIO_SWAP') {
    const result = {}
    for (let key of Object.keys(requiredPurchaseKeys)) {
      if (!(key in metadata)) {
        throw new Error(`Missing required property '${key}'`)
      }
      if (typeof metadata[key] !== requiredPurchaseKeys[key].type) {
        throw new Error(
          `Invalid type for property '${key}'. Found '${typeof metadata[key]}', expected '${requiredPurchaseKeys[key].type}'`
        )
      }
      result[key] = metadata[key]
    }
    return result
  }
  throw new Error('Invalid discriminator')
}

module.exports = function (app) {
  app.post(
    '/transaction_metadata',
    handleResponse(async (req, res, next) => {
      const { transactionSignature, metadata } = req.body
      let validationResult
      try {
        validationResult = validateMetadata(metadata)
      } catch (e) {
        return errorResponseBadRequest(`Invalid metadata: ${e.message}`)
      }
      try {
        await models.UserBankTransactionMetadata.create({
          transactionSignature,
          metadata: validationResult
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
