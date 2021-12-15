const { handleResponse, sendResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const ethTxRelay = require('../relay/ethTxRelay')
const crypto = require('crypto')
const { getFeePayer } = require('../solana-client')

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
const feePayerAccount = getFeePayer()

module.exports = function (app) {
  app.post('/wormhole_relay', async (req, res, next) => {
    const audiusLibs = req.app.get('audiusLibs')
    const slackReporter = req.app.get('slackReporter')
    const body = req.body
    const logs = []
    const context = {}
    try {

        // Validate the request body is of correct shape
        if (!body.senderAddress || !checkContract(body.permit) || !checkContract(body.transferTokens)) {
        return sendResponse(
                req,
                res,
                errorResponseBadRequest('Missing one of the required fields: senderAddress, permit, transferTokens')
            )
        }

        // Send off permit tx
        logs.push(`Attempting Permit for sender: ${body.senderAddress}`)
        const { sha: permitSHA, txProps: permitTxProps} = getTxProps(body.senderAddress, body.permit)
        const permitTxResponse = await ethTxRelay.sendEthTransaction(req, permitTxProps, permitSHA)
        logs.push(`Permit Succeded with tx hash: ${permitTxResponse.txHash}`)
        context.permitTxHash = permitTxResponse.txHash
        
        // // Send off transfer tokens to eth wormhole tx

        logs.push(`Attempting Transfer Tokens for sender: ${body.senderAddress}`)
        const { sha: transferTokensSHA, txProps: transferTokensTxProps} = getTxProps(body.senderAddress, body.transferTokens)
        const estimatedGas = await ethTxRelay.estimateEthTransactionGas(body.senderAddress, transferTokensTxProps.contractAddress, transferTokensTxProps.encodedABI)
        const gasMultiplier = 1.5
        transferTokensTxProps.gasLimit = Math.floor(estimatedGas * gasMultiplier)

        const transferTokensTxResponse = await ethTxRelay.sendEthTransaction(req, transferTokensTxProps, transferTokensSHA)
        const transferTxHash = transferTokensTxResponse.txHash
        context.transferTxHash = transferTxHash
        logs.push(`Attempting Transfer Tokens for sender: ${transferTxHash}`)

        const signTransaction = async (transaction) => {
            req.logger.info(`Signing Transaction`)
            transaction.partialSign(feePayerAccount)
            return transaction
        }

        const response = await audiusLibs.wormholeClient.attestAndCompleteTransferEthToSol(transferTxHash, signTransaction, {
            transport: NodeHttpTransport()
        })
        if (response.error) {
            logs.push(`Attest and complete transfer from eth to sol failed on phase: ${response.phase} \n error: ${response.error} \n with logs: ${response.logs.join(',')}`)
            const message = slackReporter.getJsonSlackMessage({ logs: logs.join(','), error: response.error.toString() })
            await slackReporter.postToSlack({ message })
            return sendResponse(
                req,
                res,
                errorResponseServerError(response.error.toString())
            )
        }

        logs.push(`Attest and complete transfer from eth to sol succeeded: ${response.transactionSignature}`)
        context.completeTransferSignature = response.transactionSignature

        req.logger.info(context, logs.join(','))

        return sendResponse(req, res, successResponse({
            transferTxHash,
            txHash: response.txHash
        }))

    } catch (error) {
        const message = slackReporter.getJsonSlackMessage({ logs: logs.join(','), error: error.message.toString() })
        await slackReporter.postToSlack({ message })
        req.logger.error(context, logs.join(','))
        return sendResponse(
            req,
            res,
            errorResponseServerError('it did not work')
        )
    }

  })
}
