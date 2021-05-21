const axios = require('axios')
const { recoverPersonalSignature } = require('eth-sig-util')
const { sendResponse, errorResponseBadRequest } = require('./apiHelpers')

const models = require('./models')

const audiusLibsWrapper = require('./audiusLibsInstance')

/**
 * queryDiscprovForUserId - Queries the discovery provider for the user w/ the walletaddress
 * @param {string} walletAddress
 * @returns {object} User Metadata object
 */
const queryDiscprovForUserId = async (walletAddress, handle) => {
  const { discoveryProvider } = audiusLibsWrapper.getAudiusLibs()

  const response = await axios({
    method: 'get',
    url: `${discoveryProvider.discoveryProviderEndpoint}/users`,
    params: {
      wallet: walletAddress
    }
  })

  if (!Array.isArray(response.data.data) || !(response.data.data.length >= 1)) {
    throw new Error('Unable to retrieve user from discovery provder')
  }
  let usersList = response.data.data
  if (usersList.length === 1) {
    const [user] = response.data.data
    return user
  } else {
    for (let respUser of usersList) {
      if (respUser.handle === handle) {
        return respUser
      }
    }
  }
}

/**
 * Authentication Middleware
 * 1) Using the `Encoded-Data-Message` & `Encoded-Data-Signature` header recover the wallet address
 * 2) If a user in the `Users` table with the `walletAddress` value, attach that user to the request
 * 3) Else query the discovery provider for the user's blockchain userId w/ the wallet address & attach to query
 */
async function authMiddleware (req, res, next) {
  try {
    const encodedDataMessage = req.get('Encoded-Data-Message')
    const signature = req.get('Encoded-Data-Signature')
    const handle = req.query.handle

    if (!encodedDataMessage) throw new Error('[Error]: Encoded data missing')
    if (!signature) throw new Error('[Error]: Encoded data signature missing')

    let walletAddress = recoverPersonalSignature({ data: encodedDataMessage, sig: signature })
    const user = await models.User.findOne({
      where: { walletAddress },
      attributes: ['id', 'blockchainUserId', 'walletAddress', 'createdAt']
    })
    if (!user) throw new Error(`[Error]: no user found for wallet address ${walletAddress}`)

    if (user && user.blockchainUserId) {
      req.user = user
      next()
    } else {
      const discprovUser = await queryDiscprovForUserId(walletAddress, handle)
      await user.update({ blockchainUserId: discprovUser.user_id })
      req.user = user
      next()
    }
  } catch (err) {
    const errorResponse = errorResponseBadRequest('[Error]: The wallet address is not associated with a user id')
    return sendResponse(req, res, errorResponse)
  }
}

module.exports = authMiddleware
