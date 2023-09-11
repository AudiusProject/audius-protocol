const express = require('express')
const crypto = require('crypto')
const {
  sendTransactionWithLookupTable
} = require('../utils/solanaAddressLookupTable')

const { parameterizedAuthMiddleware } = require('../authMiddleware')
const {
  handleResponse,
  successResponse,
  errorResponseServerError
} = require('../apiHelpers')
const { getFeePayerKeypair } = require('../solana-client')
const {
  isSendInstruction,
  areRelayAllowedInstructions,
  doesUserHaveSocialProof
} = require('../utils/relayHelpers')
const { getFeatureFlag, FEATURE_FLAGS } = require('../featureFlag')

const { PublicKey, TransactionInstruction } = require('@solana/web3.js')

const solanaRouter = express.Router()

// Check that an instruction has all the necessary data
const isValidInstruction = (instr) => {
  if (!instr || !Array.isArray(instr.keys) || !instr.programId || !instr.data)
    return false
  if (!instr.keys.every((key) => !!key.pubkey)) return false
  return true
}

const isTransactionTooLargeError = (error) => {
  const matcher = /(?:Transaction too large)(.*)$/
  const res = error.match(matcher)
  return !!res
}

const handleV0Tx = async (instructions, feePayerOverride, signatures) => {
  console.log('REED got tx too large error, retrying with v0 tx')
  const feePayerKeypair = getFeePayerKeypair(false, feePayerOverride)
  console.log('REED got feePayerKeypair:', feePayerKeypair)
  try {
    const transactionSignature = await sendTransactionWithLookupTable(
      instructions,
      feePayerKeypair,
      signatures
    )
    return successResponse({ transactionSignature })
  } catch (e) {
    console.log('REED error sending v0 tx:', e)
    const errorString = 'Error sending v0 tx'
    return errorResponseServerError(errorString, { error: e })
  }
}

solanaRouter.post(
  '/relay',
  parameterizedAuthMiddleware({ shouldResponseBadRequest: false }),
  handleResponse(async (req, res, next) => {
    const redis = req.app.get('redis')
    const libs = req.app.get('audiusLibs')

    // Get configs
    let optimizelyClient
    let socialProofRequiredToSend = true
    try {
      optimizelyClient = req.app.get('optimizelyClient')
      socialProofRequiredToSend = getFeatureFlag(
        optimizelyClient,
        FEATURE_FLAGS.SOCIAL_PROOF_TO_SEND_AUDIO_ENABLED
      )
    } catch (error) {
      req.logger.error(
        `failed to retrieve optimizely feature flag for socialProofRequiredToSend: ${error}`
      )
    }

    // Unpack instructions
    let {
      instructions = [],
      skipPreflight,
      feePayerOverride,
      signatures = [],
      retry = true,
      recentBlockhash
    } = req.body

    // Allowed relay checks
    const isRelayAllowed = await areRelayAllowedInstructions(
      instructions,
      optimizelyClient
    )
    // if (!isRelayAllowed) {
    //   return errorResponseServerError(`Invalid relay instructions`, {
    //     error: `Invalid relay instructions`
    //   })
    // }

    // Social proof checks
    if (socialProofRequiredToSend && isSendInstruction(instructions)) {
      if (!req.user) {
        return errorResponseServerError(`User has no auth record`, {
          error: 'No auth record'
        })
      }

      const userHasSocialProof = await doesUserHaveSocialProof(req.user)
      if (!userHasSocialProof) {
        const handle = req.user.handle || ''
        return errorResponseServerError(
          `User ${handle} is missing social proof`,
          { error: 'Missing social proof' }
        )
      }
    }

    const reqBodySHA = crypto
      .createHash('sha256')
      .update(JSON.stringify({ instructions }))
      .digest('hex')

    instructions = instructions.filter(isValidInstruction).map((instr) => {
      const keys = instr.keys.map((key) => ({
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

    const {
      res: transactionSignature,
      error,
      errorCode
    } = await transactionHandler.handleTransaction({
      recentBlockhash,
      signatures: (signatures || []).map((s) => ({
        ...s,
        signature: Buffer.from(s.signature.data)
      })),
      instructions,
      skipPreflight,
      feePayerOverride,
      retry
    })

    if (error) {
      // if the tx fails due to being too large, retry with v0 tx
      if (isTransactionTooLargeError(error)) {
        return await handleV0Tx(instructions, feePayerOverride, signatures)
      }
      // if the tx fails, store it in redis with a 24 hour expiration
      await redis.setex(
        `solanaFailedTx:${reqBodySHA}`,
        60 /* seconds */ * 60 /* minutes */ * 24 /* hours */,
        JSON.stringify(req.body)
      )
      req.logger.error('Error in solana transaction:', error, reqBodySHA)
      const errorString = `Something caused the solana transaction to fail for payload ${reqBodySHA}`
      return errorResponseServerError(errorString, { errorCode, error })
    }

    return successResponse({ transactionSignature })
  })
)

solanaRouter.get(
  '/random_fee_payer',
  handleResponse(async () => {
    const feePayerAccount = getFeePayerKeypair(false)
    if (!feePayerAccount) {
      return errorResponseServerError('There is no fee payer.')
    }
    return successResponse({ feePayer: feePayerAccount.publicKey.toString() })
  })
)

module.exports = function (app) {
  app.use('/solana', solanaRouter)
}
