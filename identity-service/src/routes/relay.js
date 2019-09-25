const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const txRelay = require('../txRelay')

module.exports = function (app) {
  // TODO(roneilr): authenticate that user controls senderAddress somehow, potentially validate that
  // method sig has come from sender address as well
  app.post('/relay', handleResponse(async (req, res, next) => {
    let body = req.body
    if (body && body.contractRegistryKey && body.contractAddress && body.senderAddress && body.encodedABI) {
      // send tx
      let receipt
      try {
        receipt = await txRelay.sendTransaction(
          body.contractRegistryKey,
          body.contractAddress,
          body.encodedABI,
          body.senderAddress,
          false,
          body.gasLimit || null)
      } catch (e) {
        if (e.message.includes('nonce')) {
          req.logger.warn('Nonce got out of sync, resetting. Original error message: ', e.message)
          // this is a retry in case we get an error about the nonce being out of sync
          // the last parameter is an optional bool that forces a nonce reset
          receipt = await txRelay.sendTransaction(
            body.contractRegistryKey,
            body.contractAddress,
            body.encodedABI,
            body.senderAddress,
            true,
            body.gasLimit || null)
          // no need to return success response here, regular code execution will continue after catch()
        } else if (e.message.includes('already been submitted')) {
          return errorResponseBadRequest(e.message)
        } else {
          req.logger.error('Error in transaction:', e.message)
          return errorResponseServerError('Something caused the transaction to fail')
        }
      }

      return successResponse({ receipt: receipt })
    } else return errorResponseBadRequest('Missing one of the required fields: contractRegistryKey, contractAddress, senderAddress, encodedABI')
  }))
}
