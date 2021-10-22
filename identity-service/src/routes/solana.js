const express = require('express')
const crypto = require('crypto')

const config = require('../config')
const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const { getFeePayer } = require('../solana-client')
const audiusLibsWrapper = require('../audiusLibsInstance')

const solanaEndpoint = config.get('solanaEndpoint')

const {
  Connection,
  PublicKey,
  Secp256k1Program,
  sendAndConfirmTransaction,
  Transaction,
  TransactionInstruction
} = require('@solana/web3.js')

const solanaRouter = express.Router()
const connection = new Connection(solanaEndpoint)

// Check that an instruction has all the necessary data
const isValidInstruction = (instr) => {
  if (!instr || !Array.isArray(instr.keys) || !instr.programId || !instr.data) return false
  if (!instr.keys.every(key => !!key.pubkey)) return false
  return true
}

solanaRouter.post('/relay', handleResponse(async (req, res, next) => {
  const redis = req.app.get('redis')
  const libs = req.app.get('audiusLibs')

  let { instructions = [] } = req.body

  const reqBodySHA = crypto.createHash('sha256').update(JSON.stringify({ instructions })).digest('hex')

  instructions = instructions.filter(isValidInstruction).map((instr) => {
    const keys = instr.keys.map(key => ({
      pubkey: new PublicKey(key.pubkey),
      isSigner: key.isSigner,
      isWritable: key.isWritable
    }))
    return new TransactionInstruction({
      keys,
      programId: new PublicKey(instr.programId),
      data: Buffer.from(instr.data)
    })
  })

  const transactionHandler = libs.solanaWeb3Manager.transactionHandler
  const { res: transactionSignature, error, errorCode } = await transactionHandler.handleTransaction(instructions)

  if (error) {
    // if the tx fails, store it in redis with a 24 hour expiration
    await redis.setex(`solanaFailedTx:${reqBodySHA}`, 60 /* seconds */ * 60 /* minutes */ * 24 /* hours */, JSON.stringify(req.body))
    req.logger.error('Error in solana transaction:', error, reqBodySHA)
    const errorString = `Something caused the solana transaction to fail for payload ${reqBodySHA}`
    return errorResponseServerError(errorString, { errorCode, error } )
  }

  return successResponse({ transactionSignature })
}))

module.exports = function (app) {
  app.use('/solana', solanaRouter)
}
