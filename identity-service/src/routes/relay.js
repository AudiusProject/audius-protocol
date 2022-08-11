const crypto = require('crypto')

const { handleResponse, successResponse, errorResponseBadRequest, errorResponseForbidden, errorResponseServerError } = require('../apiHelpers')
const txRelay = require('../relay/txRelay')
const captchaMiddleware = require('../captchaMiddleware')
const { detectAbuse } = require('../utils/antiAbuse')
const { getFeatureFlag, FEATURE_FLAGS } = require('../featureFlag')

const blockRelayAbuseErrorCodes = new Set(['3', '8', '10', '11', '12', '13', '14', '15'])

module.exports = function (app) {
  // TODO(roneilr): authenticate that user controls senderAddress somehow, potentially validate that
  // method sig has come from sender address as well
  app.post('/relay', captchaMiddleware, handleResponse(async (req, res, next) => {
    const body = req.body
    const redis = req.app.get('redis')

    // TODO: Use auth middleware to derive this
    const user = await models.User.findOne({
      where: { req.senderAddress },
      attributes: ['id', 'blockchainUserId', 'walletAddress', 'handle', 'isAbusive', 'isAbusiveErrorCode']
    })

    let optimizelyClient
    let detectAbuseOnRelay = false
    let blockAbuseOnRelay = false
    try {
      optimizelyClient = req.app.get('optimizelyClient')
      detectAbuseOnRelay = getFeatureFlag(optimizelyClient, FEATURE_FLAGS.DETECT_ABUSE_ON_RELAY)
      blockAbuseOnRelay = getFeatureFlag(optimizelyClient, FEATURE_FLAGS.BLOCK_ABUSE_ON_RELAY)
    } catch (error) {
      req.logger.error(`failed to retrieve optimizely feature flag for detectAbuseOnRelay: ${error}`)
    }

    if (blockAbuseOnRelay && user?.isAbusiveErrorCode) {
      return errorResponseForbidden(
        `Forbidden ${user.isAbusiveErrorCode}`
      )
    }

    if (body && body.contractRegistryKey && body.contractAddress && body.senderAddress && body.encodedABI) {
      // send tx
      let receipt
      const reqBodySHA = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex')
      try {
        var txProps = {
          contractRegistryKey: body.contractRegistryKey,
          contractAddress: body.contractAddress,
          encodedABI: body.encodedABI,
          senderAddress: body.senderAddress,
          gasLimit: body.gasLimit || null
        }
        receipt = await txRelay.sendTransaction(
          req,
          false, // resetNonce
          txProps,
          reqBodySHA)
      } catch (e) {
        if (e.message.includes('nonce')) {
          req.logger.warn('Nonce got out of sync, resetting. Original error message: ', e.message)
          // this is a retry in case we get an error about the nonce being out of sync
          // the last parameter is an optional bool that forces a nonce reset
          receipt = await txRelay.sendTransaction(
            req,
            true, // resetNonce
            txProps,
            reqBodySHA)
          // no need to return success response here, regular code execution will continue after catch()
        } else {
          // if the tx fails, store it in redis with a 24 hour expiration
          await redis.setex(`failedTx:${reqBodySHA}`, 60 /* seconds */ * 60 /* minutes */ * 24 /* hours */, JSON.stringify(req.body))

          req.logger.error('Error in transaction:', e.message, reqBodySHA)
          return errorResponseServerError(
            `Something caused the transaction to fail for payload ${reqBodySHA}, ${e.message}`
          )
        }
      }

      if (detectAbuseOnRelay) {
        const reqIP = req.get('X-Forwarded-For') || req.ip
        detectAbuse(user, 'relay', body.senderAddress, reqIP) // fired & forgotten
      }

      return successResponse({ receipt: receipt })
    }

    return errorResponseBadRequest('Missing one of the required fields: contractRegistryKey, contractAddress, senderAddress, encodedABI')
  }))
}
