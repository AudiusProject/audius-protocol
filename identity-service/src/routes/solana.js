const express = require('express')
const { handleResponse, successResponse, errorResponseBadRequest, errorResponseServerError } = require('../apiHelpers')
const { getFeePayer } = require('../solana-client')
const crypto = require('crypto')

const {
  Connection,
  PublicKey,
  Secp256k1Program,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction
} = require('@solana/web3.js')

// TODO: Get from config
const solanaClusterEndpoint = 'https://api.mainnet-beta.solana.com'

const solanaRouter = express.Router()
const connection = new Connection(solanaClusterEndpoint)

// Home page route.
solanaRouter.post('/relay', handleResponse(async (req, res, next) => {
  const redis = req.app.get('redis')
  const { recentBlockhash, secpInstruction, instruction } = req.body
  req.logger.info(JSON.stringify(instruction, null, ' '))

  const reqBodySHA = crypto.createHash('sha256').update(JSON.stringify({ secpInstruction, instruction })).digest('hex')

  try {
    if (!instruction) return errorResponseBadRequest('Please provide transaction instruction')
    const tx = new Transaction({ recentBlockhash })

    if (secpInstruction) {
      const secpTransactionInstruction = Secp256k1Program.createInstructionWithPublicKey({
        publicKey: Buffer.from(secpInstruction.publicKey),
        message: (new PublicKey(secpInstruction.message)).toBytes(),
        signature: Buffer.from(secpInstruction.signature),
        recoveryId: secpInstruction.recoveryId
      })
      tx.add(secpTransactionInstruction)
    }

    const keys = instruction.keys.map(key => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable
    }))

    const feePayerAccount = getFeePayer()

    const txInstruction = new TransactionInstruction({
      keys,
      programId: new PublicKey(instruction.programId),
      data: Buffer.from(instruction.data)
    })
    tx.add(txInstruction)
    tx.sign(feePayerAccount)

    const transactionSignature = await sendAndConfirmTransaction(
      connection,
      tx,
      [feePayerAccount],
      {
        skipPreflight: true,
        commitment: 'processed',
        preflightCommitment: 'processed'
      }
    )

    return successResponse({ transactionSignature })
  } catch (e) {
    // if the tx fails, store it in redis with a 24 hour expiration
    await redis.setex(`solanaFailedTx:${reqBodySHA}`, 60 /* seconds */ * 60 /* minutes */ * 24 /* hours */, JSON.stringify(req.body))

    req.logger.error('Error in solana transaction:', e.message, reqBodySHA)
    return errorResponseServerError(`Something caused the solana transaction to fail for payload ${reqBodySHA}`)
  }
}))

module.exports = function (app) {
  app.use('/solana', solanaRouter)
}
