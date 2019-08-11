const sessionManager = require('./sessionManager')
const { sendResponse, errorResponseUnauthorized } = require('./apiHelpers')
const models = require('./models')

async function authMiddleware (req, res, next) {
  const sessionToken = req.get(sessionManager.sessionTokenHeader)
  if (!sessionToken) {
    return sendResponse(req, res, errorResponseUnauthorized('Authentication token not provided'))
  }

  const cnodeUserUUID = await sessionManager.verifySession(sessionToken)
  if (!cnodeUserUUID) {
    return sendResponse(req, res, errorResponseUnauthorized('Invalid authentication token'))
  }
  req.userId = cnodeUserUUID

  const cnodeUser = await models.CNodeUser.findOne({ where: { cnodeUserUUID: cnodeUserUUID } })
  const cnodeUserWallet = cnodeUser.walletPublicKey
  req.session = { wallet: cnodeUserWallet }

  next()
}

module.exports = authMiddleware
