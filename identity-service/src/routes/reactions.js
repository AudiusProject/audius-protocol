const { handleResponse, errorResponseBadRequest, errorResponseServerError, successResponse } = require('../apiHelpers')
const authMiddleware = require('../authMiddleware')
const models = require('../models')
const { logger } = require('../logging')

const MAX_REACTIONS_PER_FETCH = 100

const handleReaction = async ({ senderWallet, reactionType, reactedTo, libs, reactionValue }) => {
  const { solanaWeb3Manager } = libs
  const currentSlot = await solanaWeb3Manager.getSlot()

  const now = Date.now()
  await models.Reactions.create({
    slot: currentSlot,
    reactionValue,
    senderWallet,
    reactionType,
    reactedTo,
    createdAt: now,
    updatedAt: now
  })
}

const getReactions = async ({ startIndex, limit }) => {
  const reactions = await models.Reactions.findAll({
    where: {
      id: { [models.Sequelize.Op.gte]: startIndex }
    },
    order: [[models.Sequelize.col('id'), 'ASC']],
    limit
  })
  return reactions
}

module.exports = function (app) {
  /**
   * POST a new reaction, represented by a numeric ID (reaction) and reactedTo (entity being reacted upon)
   */
  app.post('/reactions', authMiddleware, handleResponse(async (req, res, next) => {
    // Validation
    const senderWallet = req.user.walletAddress
    const { reactedTo, reactionValue } = req.body

    if (!senderWallet || !reactedTo || reactionValue === undefined) return errorResponseBadRequest(`Missing argument: ${JSON.stringify({ senderWallet, reactedTo, reactionValue })}`)

    const parsedReaction = parseInt(reactionValue)
    if (parsedReaction === NaN) return errorResponseBadRequest('Invalid reaction type')

    const libs = req.app.get('audiusLibs')

    try {
      logger.info(`Creating reaction ${reactionValue} for reactedTo: ${reactedTo}`)
      await handleReaction({ senderWallet, reactedTo, reactionValue: parsedReaction, reactionType: 'tip', libs })
      return successResponse()
    } catch (e) {
      logger.error(`Caught error trying to create reaction ${reactionValue} for id: ${reactedTo}: ${e}`)
      return errorResponseServerError('Something went wrong')
    }
  }))

  /**
   * Get all reactions with ID >= startIndex
   */
  app.get('/reactions', handleResponse(async (req, res, next) => {
    let { startIndex, limit } = req.query
    startIndex = startIndex || 0
    limit = Math.min(MAX_REACTIONS_PER_FETCH, limit || MAX_REACTIONS_PER_FETCH)

    try {
      const reactions = await getReactions({ startIndex, limit })
      return successResponse({
        reactions
      })
    } catch (e) {
      logger.error(`Caught error trying to get reactions: ${e}`)
      return errorResponseServerError('Something went wrong')
    }
  }))
}
