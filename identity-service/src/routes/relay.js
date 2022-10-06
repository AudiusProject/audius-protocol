const crypto = require('crypto')

const {
  handleResponse,
  successResponse,
  errorResponseBadRequest,
  errorResponseForbidden,
  errorResponseServerError
} = require('../apiHelpers')
const txRelay = require('../relay/txRelay')
const captchaMiddleware = require('../captchaMiddleware')
const { detectAbuse } = require('../utils/antiAbuse')
const { getFeatureFlag, FEATURE_FLAGS } = require('../featureFlag')
const models = require('../models')
const { getIP } = require('../utils/antiAbuse')
const { libs } = require('@audius/sdk')
const config = require('../config.js')

const getAbuseBehavior = (req) => {
  let optimizelyClient
  let detectAbuseOnRelay = false
  let blockAbuseOnRelay = false
  try {
    optimizelyClient = req.app.get('optimizelyClient')
    detectAbuseOnRelay = getFeatureFlag(
      optimizelyClient,
      FEATURE_FLAGS.DETECT_ABUSE_ON_RELAY
    )
    blockAbuseOnRelay = getFeatureFlag(
      optimizelyClient,
      FEATURE_FLAGS.BLOCK_ABUSE_ON_RELAY
    )
  } catch (error) {
    req.logger.error(
      `failed to retrieve optimizely feature flag for ${FEATURE_FLAGS.DETECT_ABUSE_ON_RELAY} or ${FEATURE_FLAGS.BLOCK_ABUSE_ON_RELAY}: ${error}`
    )
  }
  return { detectAbuseOnRelay, blockAbuseOnRelay }
}

module.exports = function (app) {
  // TODO(roneilr): authenticate that user controls senderAddress somehow, potentially validate that
  // method sig has come from sender address as well
  app.post(
    '/relay',
    captchaMiddleware,
    handleResponse(async (req, res, next) => {
      const body = req.body
      const redis = req.app.get('redis')

      // TODO: Use auth middleware to derive this
      const user = await models.User.findOne({
        where: { walletAddress: body.senderAddress },
        attributes: [
          'id',
          'blockchainUserId',
          'walletAddress',
          'handle',
          'isBlockedFromRelay',
          'isBlockedFromNotifications',
          'appliedRules'
        ]
      })

      // Handle abusive users
      // TODO: I think we can lose blockAbuseOnRelay
      // TODO: potential problems:
      //  - on first call, we're not going to call detectAbuse till after
      //  - on first call, we may not call detectAbuseOnRelay at all:
      // Maybe we should do this for *all* users if they've never been monitored before
      const { detectAbuseOnRelay, blockAbuseOnRelay } = getAbuseBehavior(req)

      // TODO: remove this one
      req.logger.info(
        `abuse: detect: ${detectAbuseOnRelay} block: ${blockAbuseOnRelay} userid: ${user?.id} handle: ${user?.handle}`
      )

      const userFlaggedAsAbusive =
        user?.isBlockedFromRelay || user?.isBlockedFromNotifications

      // Always call detectAbuse if a user is already flagged as abusive,
      // or if they're selected randomly via detectAbuseOnRelay
      if (user && (userFlaggedAsAbusive || detectAbuseOnRelay)) {
        const reqIP = getIP(req)
        detectAbuse(user, 'relay', reqIP) // fired & forgotten
      }

      // Only reject relay for users explicitly blocked from relay
      if (user?.isBlockedFromRelay) {
        req.logger.info(`abuse: user ${user.handle} blocked from relay`)
        return errorResponseForbidden(`Forbidden ${user.appliedRules}`)
      }

      let txProps
      if (
        body &&
        body.contractRegistryKey &&
        body.contractAddress &&
        body.senderAddress &&
        body.encodedABI
      ) {
        // send tx
        let receipt
        const reqBodySHA = crypto
          .createHash('sha256')
          .update(JSON.stringify(req.body))
          .digest('hex')
        try {
          txProps = {
            contractRegistryKey: body.contractRegistryKey,
            contractAddress: body.contractAddress,
            encodedABI: body.encodedABI,
            senderAddress: body.senderAddress,
            gasLimit: body.gasLimit || null
          }

          // When EntityManager is enabled for replica sets, throw error for URSM
          // Fallback to EntityManager
          if (
            config.get('entityManagerReplicaSetEnabled') &&
            txProps.contractRegistryKey === 'UserReplicaSetManager'
          ) {
            const decodedABI = libs.AudiusABIDecoder.decodeMethod(
              txProps.contractRegistryKey,
              txProps.encodedABI
            )
            if (decodedABI.name === 'updateReplicaSet') {
              throw new Error(
                'Cannot relay UserReplicaSetManager transactions when EntityManager is enabled'
              )
            }
          }
          receipt = await txRelay.sendTransaction(
            req,
            false, // resetNonce
            txProps,
            reqBodySHA
          )
        } catch (e) {
          if (e.message.includes('nonce')) {
            req.logger.warn(
              'Nonce got out of sync, resetting. Original error message: ',
              e.message
            )
            // this is a retry in case we get an error about the nonce being out of sync
            // the last parameter is an optional bool that forces a nonce reset
            receipt = await txRelay.sendTransaction(
              req,
              true, // resetNonce
              txProps,
              reqBodySHA
            )
            // no need to return success response here, regular code execution will continue after catch()
          } else {
            // if the tx fails, store it in redis with a 24 hour expiration
            await redis.setex(
              `failedTx:${reqBodySHA}`,
              60 /* seconds */ * 60 /* minutes */ * 24 /* hours */,
              JSON.stringify(req.body)
            )

            req.logger.error('Error in transaction:', e.message, reqBodySHA)
            return errorResponseServerError(
              `Something caused the transaction to fail for payload ${reqBodySHA}, ${e.message}`
            )
          }
        }

        return successResponse({ receipt: receipt })
      }

      return errorResponseBadRequest(
        'Missing one of the required fields: contractRegistryKey, contractAddress, senderAddress, encodedABI'
      )
    })
  )
}
