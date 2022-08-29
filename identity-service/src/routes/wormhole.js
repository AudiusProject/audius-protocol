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

/**
 * Transfers erc20 AUDIO into spl AUDIO via the wormhole
 * Relays the Permit method to our wormhole contract
 * Relays the TransferTokens method on our wormhole contract to send the funds into wormhole
 * Redeems the funds in solana
 * @param {*} req Node request - used for logging when passed to sendEthTransaction
 * @param {*} audiusLibs Audius Libs instance for completing the wormhole transfer
 * @param {*} senderAddress The sender's eth address
 * @param {*} permit Object containing contractAddress, encodedABI and gasLimit for permit method
 * @param {*} transferTokens Object containing contractAddress, encodedABI and gasLimit for permit method
 * @param {*} reportError Reporter instance for logging & sending logs to slack
 */
const relayWormhole = async (
  req,
  audiusLibs,
  senderAddress,
  permit,
  transferTokens,
  reportError
) => {
  const logs = []
  const context = { job: 'wormhole' }
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

    let response = null
    let numRetries = 0
    const MAX_RETRIES = 5
    while ((!response || !response.transactionSignature) && numRetries < MAX_RETRIES) {
      // Gather VAA attestations, submit to solana and realize the funds at the taret address
      response = await audiusLibs.wormholeClient.attestAndCompleteTransferEthToSol(transferTxHash, signTransaction, {
        transport: NodeHttpTransport()
      })
      if (response.error) {
        if (numRetries !== MAX_RETRIES - 1) {
          // Exponential backoff 100ms, 200ms, 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, 2 ** (numRetries) * 100))
        }
        numRetries += 1
        logs.push(`Attest and complete transfer from eth to sol failed on phase: ${
          response.phase
        } \n error: ${response.error} \n with logs: ${
          response.logs.join(',')
        } \n on retry num: ${numRetries}`)
      }
    }

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
      redeemTxSignature: response.transactionSignature
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
        redeemTxSignature,
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
        redeemTxSignature
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
