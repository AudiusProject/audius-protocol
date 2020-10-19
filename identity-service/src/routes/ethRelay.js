const { handleResponse, sendResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const ethTxRelay = require('../relay/ethTxRelay')
const crypto = require('crypto')

module.exports = function (app) {
  // Relay operations to main ethereum chain
  app.post('/eth_relay', async (req, res, next) => {
    let body = req.body
    if (body && body.contractAddress && body.senderAddress && body.encodedABI) {
      // send tx
      const reqBodySHA = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex')
      try {
        var txProps = {
          contractAddress: body.contractAddress,
          encodedABI: body.encodedABI,
          senderAddress: body.senderAddress,
          gasLimit: body.gasLimit || null
        }
        const resp = await ethTxRelay.sendEthTransaction(req, txProps, reqBodySHA)
        return sendResponse(req, res, successResponse({ resp }))
      } catch (e) {
        req.logger.error('Error in transaction:', e.message, reqBodySHA)

        return sendResponse(req, res, errorResponseServerError(`Something caused the transaction to fail for payload ${reqBodySHA}`))
      }
    } else {
      return sendResponse(
        req,
        res,
        errorResponseServerError('Missing one of the required fields: contractRegistryKey, contractAddress, senderAddress, encodedABI')
      )
    }
  })

  // Query which returns public key of associated relayer wallet for a given address
  app.get('/eth_relayer', handleResponse(async (req, res, next) => {
    const { wallet } = req.query
    if (!wallet) return errorResponseBadRequest('Please provide a wallet')
    let selectedEthWallet = await ethTxRelay.queryEthRelayerWallet(wallet)
    return successResponse({ selectedEthWallet })
  }))

  // Serves latest state of production gas tracking on identity service
  app.get('/eth_gas_price', handleResponse(async (req, res, next) => {
    let gasInfo = await ethTxRelay.getProdGasInfo(req.app.get('redis'), req.logger)
    return successResponse(gasInfo)
  }))
}
