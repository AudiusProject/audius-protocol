import type { AudiusLibs } from '@audius/sdk-legacy/dist/libs'
import { parameterizedAuthMiddleware } from '../../authMiddleware'
import express, { RequestHandler } from 'express'
import {
  Keypair,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import axios from 'axios'

import { InvalidRelayInstructionError } from './InvalidRelayInstructionError'

import {
  errorResponseBadRequest,
  errorResponseServerError,
  handleResponse,
  successResponse
} from '../../apiHelpers'

import { assertRelayAllowedInstructions } from './solanaRelayChecks'
import { getFeePayerKeypair } from '../../solana-client'
import config from '../../config'

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
  useCoinflowRelay?: boolean
}

const COINFLOW_API_RELAY = 'https://api.coinflow.cash/api/utils/send-solana-tx'

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
          lookupTableAddresses = [],
          useCoinflowRelay = false
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

        if (useCoinflowRelay) {
          const feePayerAccounts = config
            .get('solanaFeePayerWallets')
            .map((item: any) => item.privateKey)
            .map((key: number[]) => Keypair.fromSecretKey(Uint8Array.from(key)))
          const feePayerAccount = feePayerAccounts.find(
            (keypair: Keypair) =>
              keypair.publicKey.toString() === feePayerOverride
          )
          const message = new TransactionMessage({
            payerKey: feePayerAccount.publicKey,
            recentBlockhash,
            instructions
          }).compileToV0Message()
          const tx = new VersionedTransaction(message)
          tx.sign([feePayerAccount])
          signatures.forEach(({ publicKey, signature }) => {
            tx.addSignature(new PublicKey(publicKey), Buffer.from(signature))
          })
          const rawTransaction = tx.serialize()
          const encodedTx = Buffer.from(rawTransaction).toString('base64')
          const res = await axios.post(
            COINFLOW_API_RELAY,
            {
              transaction: encodedTx
            },
            {
              headers: {
                Authorization: config.get('coinflowApiKey')
              }
            }
          )
          return successResponse({ res })
        }

        // Check that the instructions are allowed for relay
        await assertRelayAllowedInstructions(instructions, {
          user: req.user,
          feePayer: feePayerOverride
        })

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
          feePayerOverride: new PublicKey(feePayerOverride),
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
