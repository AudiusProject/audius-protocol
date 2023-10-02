import type { AudiusLibs } from '@audius/sdk'
import { parameterizedAuthMiddleware } from '../../authMiddleware'
import express, { RequestHandler } from 'express'
import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js'

import { InvalidRelayInstructionError } from './InvalidRelayInstructionError'

import {
  errorResponseBadRequest,
  errorResponseServerError,
  handleResponse,
  successResponse
} from '../../apiHelpers'

import { assertRelayAllowedInstructions } from './solanaRelayChecks'
import { getFeePayerKeypair } from '../../solana-client'

type AccountMetaJSON = {
  pubkey: string
  isSigner: boolean
  isWritable: boolean
}

type TransactionInstructionJSON = {
  keys: AccountMetaJSON[]
  programId: string
  data: number[]
}

type RelayRequestBody = {
  instructions: TransactionInstructionJSON[]
  skipPreflight: boolean
  feePayerOverride: string
  signatures: { signature: number[]; publicKey: string }[]
  retry: boolean
  recentBlockhash: string
  lookupTableAddresses: string[]
}

const isMalformedInstruction = (instr: TransactionInstructionJSON) =>
  !instr ||
  !Array.isArray(instr.keys) ||
  !instr.data ||
  !instr.keys.every((key) => !!key.pubkey)

const createRouter = () => {
  const router = express.Router()

  router.get(
    '/random_fee_payer',
    handleResponse(async () => {
      const feePayerAccount: Keypair = getFeePayerKeypair(false)
      if (!feePayerAccount) {
        return errorResponseServerError('There is no fee payer.')
      }
      return successResponse({ feePayer: feePayerAccount.publicKey.toBase58() })
    })
  )

  router.post(
    '/relay',
    parameterizedAuthMiddleware({ shouldRespondBadRequest: false }),
    handleResponse(<RequestHandler<any, any, RelayRequestBody>>(async (req) => {
      const libs: AudiusLibs = req.app.get('audiusLibs')
      const logger = req.logger
      try {
        const {
          instructions: instructionsJSON = [],
          skipPreflight,
          feePayerOverride,
          signatures = [],
          retry = true,
          recentBlockhash,
          lookupTableAddresses = []
        } = req.body

        // Ensure instructions are formed correctly
        instructionsJSON.forEach((instr, i) => {
          if (isMalformedInstruction(instr)) {
            throw new InvalidRelayInstructionError(i, 'Instruction malformed')
          }
        })

        // Parse transactions into TransactionInstructions
        const instructions = instructionsJSON.map((instr) => {
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

        // Check that the instructions are allowed for relay
        await assertRelayAllowedInstructions(instructions, { user: req.user })

        // Send transaction using transaction handler
        const transactionHandler = libs.solanaWeb3Manager!.transactionHandler
        const {
          res: transactionSignature,
          error,
          errorCode
        } = await transactionHandler.handleTransaction({
          recentBlockhash,
          signatures: (signatures || []).map((s) => ({
            ...s,
            signature: Buffer.from(s.signature)
          })),
          instructions,
          skipPreflight,
          // @ts-ignore TODO: This will be fixed when SDK updates
          feePayerOverride,
          lookupTableAddresses,
          retry
        })

        if (error) {
          req.logger.error('Error in Solana transaction:', error)
          const errorString = `Something caused the Solana transaction to fail`
          return errorResponseServerError(errorString, { errorCode, error })
        }
        return successResponse({ transactionSignature })
      } catch (e) {
        logger.error(e)
        if (e instanceof InvalidRelayInstructionError) {
          return errorResponseBadRequest('Invalid Relay Instructions')
        }
        return errorResponseServerError('Something went wrong')
      }
    }))
  )
  return router
}

export const solanaRouter = createRouter()
