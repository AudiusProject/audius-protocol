const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const txRelay = require('../relay/txRelay')
const crypto = require('crypto')

module.exports = function (app) {
  // TODO(roneilr): authenticate that user controls senderAddress somehow, potentially validate that
  // method sig has come from sender address as well
  app.post('/relay', handleResponse(async (req, res, next) => {
    return errorResponseBadRequest({ message: 'temporarily disabling relay txns' })
    let body = req.body
    const redis = req.app.get('redis')

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
          return errorResponseServerError(`Something caused the transaction to fail for payload ${reqBodySHA}`)
        }
      }

      return successResponse({ receipt: receipt })
    } else return errorResponseBadRequest('Missing one of the required fields: contractRegistryKey, contractAddress, senderAddress, encodedABI')
  }))
  app.post('/secret_relay', handleResponse(async (req, res, next) => {
    let body = req.body
    const redis = req.app.get('redis')

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
          return errorResponseServerError(`Something caused the transaction to fail for payload ${reqBodySHA}`)
        }
      }

      return successResponse({ receipt: receipt })
    } else return errorResponseBadRequest('Missing one of the required fields: contractRegistryKey, contractAddress, senderAddress, encodedABI')
  }))
}
