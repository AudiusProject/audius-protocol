const { sendResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const ethTxRelay = require('../relay/ethTxRelay')
const crypto = require('crypto')
const { getFeePayerKeypair } = require('../solana-client')

const { NodeHttpTransport } = require('@improbable-eng/grpc-web-node-http-transport')

const checkContract = (method) => {
  return method.contractAddress && method.encodedABI && method.gasLimit
}

const getTxProps = (senderAddress, method) => {
  const sha = crypto.createHash('sha256').update(JSON.stringify({ senderAddress, ...method })).digest('hex')
  return {
    sha,
    txProps: {
      contractAddress: method.contractAddress,
      encodedABI: method.encodedABI,
      senderAddress: senderAddress,
      gasLimit: method.gasLimit || null
    }
  }
}

const relayWormhole = async (
  req,
  audiusLibs,
  senderAddress,
  permit,
  transferTokens,
  reportError
) => {
  const logs = []
  const context = {}
  try {
    logs.push(`Attempting Permit for sender: ${senderAddress}`)
    const { sha: permitSHA, txProps: permitTxProps } = getTxProps(senderAddress, permit)
    const permitTxResponse = await ethTxRelay.sendEthTransaction(req, permitTxProps, permitSHA)
    logs.push(`Permit Succeded with tx hash: ${permitTxResponse.txHash}`)
    context.permitTxHash = permitTxResponse.txHash

    // Send off transfer tokens to eth wormhole tx
    logs.push(`Attempting Transfer Tokens for sender: ${senderAddress}`)
    const { sha: transferTokensSHA, txProps: transferTokensTxProps } = getTxProps(senderAddress, transferTokens)
    const estimatedGas = await ethTxRelay.estimateEthTransactionGas(senderAddress, transferTokensTxProps.contractAddress, transferTokensTxProps.encodedABI)
    const gasMultiplier = 1.05
    transferTokensTxProps.gasLimit = Math.floor(estimatedGas * gasMultiplier)

    const transferTokensTxResponse = await ethTxRelay.sendEthTransaction(req, transferTokensTxProps, transferTokensSHA)
    const transferTxHash = transferTokensTxResponse.txHash
    context.transferTxHash = transferTxHash
    logs.push(`Attempting Transfer Tokens for sender: ${transferTxHash}`)
    const feePayerAccount = getFeePayerKeypair()

    const signTransaction = async (transaction) => {
      transaction.partialSign(feePayerAccount)
      return transaction
    }

    // Gather VAA attestations, submit to solana and realize the funds at the taret address
    const response = await audiusLibs.wormholeClient.attestAndCompleteTransferEthToSol(transferTxHash, signTransaction, {
      transport: NodeHttpTransport()
    })
    if (response.error) {
      logs.push(`Attest and complete transfer from eth to sol failed on phase: ${response.phase} \n error: ${response.error} \n with logs: ${response.logs.join(',')}`)
      const errorMessage = response.error.toString()
      await reportError({ logs: logs.join(','), error: errorMessage })
      return { error: errorMessage }
    }

    logs.push(`Attest and complete transfer from eth to sol succeeded: ${response.transactionSignature}`)
    context.completeTransferSignature = response.transactionSignature

    req.logger.info(context, logs.join(','))

    return {
      transferTxHash,
      txHash: response.txHash
    }
  } catch (err) {
    req.logger.error(context, logs.join(','))
    const errorMessage = err.toString()
    await reportError({ logs: logs.join(','), error: errorMessage })
    return { error: errorMessage }
  }
}

module.exports = function (app) {
  app.post('/wormhole_relay', async (req, res, next) => {
    const audiusLibs = req.app.get('audiusLibs')
    const slackWormholeErrorReporter = req.app.get('slackWormholeErrorReporter')
    const body = req.body
    const reportError = async (errorData) => {
      const message = slackWormholeErrorReporter.getJsonSlackMessage(errorData)
      await slackWormholeErrorReporter.postToSlack({ message })
    }

    try {
      // Validate the request body is of correct shape
      if (!body.senderAddress || !checkContract(body.permit) || !checkContract(body.transferTokens)) {
        return sendResponse(
          req,
          res,
          errorResponseBadRequest('Missing one of the required fields: senderAddress, permit, transferTokens')
        )
      }
      const {
        transferTxHash,
        txHash,
        error
      } = await relayWormhole(req, audiusLibs, body.senderAddress, body.permit, body.transferTokens, reportError)
      if (error) {
        return sendResponse(
          req,
          res,
          errorResponseServerError(error)
        )
      }
      return sendResponse(req, res, successResponse({
        transferTxHash,
        txHash
      }))
    } catch (error) {
      req.logger.error(error.message)
      const errorMessage = error.message.toString()
      await reportError({ error: errorMessage })
      return sendResponse(
        req,
        res,
        errorResponseServerError(error.message.toString())
      )
    }
  })
}

module.exports.relayWormhole = relayWormhole
