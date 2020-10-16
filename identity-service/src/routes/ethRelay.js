const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const txRelay = require('../txRelay')
const crypto = require('crypto')

module.exports = function (app) {
  app.post('/eth_relay', handleResponse(async (req, res, next) => {
    let body = req.body
    if (body && body.contractAddress && body.senderAddress && body.encodedABI) {
      // send tx
      let receipt
      const reqBodySHA = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex')
      try {
        var txProps = {
          contractAddress: body.contractAddress,
          encodedABI: body.encodedABI,
          senderAddress: body.senderAddress,
          gasLimit: body.gasLimit || null
        }
        receipt = await txRelay.sendEthTransaction(req, txProps, reqBodySHA)
        return successResponse({ receipt })
      } catch (e) {
        req.logger.error('Error in transaction:', e.message, reqBodySHA)
        return errorResponseServerError(`Something caused the transaction to fail for payload ${reqBodySHA}`)
      }
      // return successResponse({ receipt: receipt })
    } else return errorResponseBadRequest('Missing one of the required fields: contractRegistryKey, contractAddress, senderAddress, encodedABI')
  }))

  app.get('/eth_relayer', handleResponse(async (req, res, next) => {
    const { wallet } = req.query
    if (!wallet) return errorResponseBadRequest('Please provide a wallet')
    let selectedEthWallet = await txRelay.selectEthRelayerWallet(wallet)
    return successResponse({ selectedEthWallet })
  }))
}
