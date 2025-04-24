import { createJupiterApiClient, Instruction } from '@jup-ag/api'
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { Feature } from '~/models/ErrorReporting'
import {
  SLIPPAGE_TOLERANCE_EXCEEDED_ERROR,
  parseJupiterInstruction
} from '~/services/Jupiter'
import {
  getJupiterQuote,
  JupiterQuoteParams
} from '~/services/JupiterTokenExchange'
import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'

export enum SwapStatus {
  IDLE = 'IDLE',
  GETTING_QUOTE = 'GETTING_QUOTE',
  PREPARING_TRANSACTION = 'PREPARING_TRANSACTION',
  CONFIRMING_TRANSACTION = 'CONFIRMING_TRANSACTION',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum SwapErrorType {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  WALLET_ERROR = 'WALLET_ERROR',
  QUOTE_FAILED = 'QUOTE_FAILED',
  UNKNOWN = 'UNKNOWN'
}

export type SwapTokensParams = Omit<JupiterQuoteParams, 'slippageBps'> & {
  /**
   * Slippage tolerance in basis points (e.g., 50 = 0.5%)
   * Defaults to 50 if not provided
   */
  slippageBps?: number
}

export type SwapTokensResult = {
  status: SwapStatus
  signature?: string
  error?: {
    type: SwapErrorType
    message: string
  }
  inputAmount?: {
    amount: number
    uiAmount: number
  }
  outputAmount?: {
    amount: number
    uiAmount: number
  }
}

/**
 * Hook for executing token swaps using Jupiter
 */
export const useSwapTokens = () => {
  const queryClient = useQueryClient()
  const { solanaWalletService, reportToSentry, audiusSdk } =
    useAudiusQueryContext()

  return useMutation<SwapTokensResult, Error, SwapTokensParams>({
    mutationFn: async (params): Promise<SwapTokensResult> => {
      try {
        // Default slippage is 50 basis points (0.5%)
        const slippageBps = params.slippageBps ?? 50

        // Step 1: Get the wallet keypair
        const keypair = await solanaWalletService.getKeypair()
        if (!keypair) {
          throw new Error('Failed to get wallet keypair')
        }

        // Step 2: Get a quote from Jupiter
        let quoteResult
        try {
          quoteResult = await getJupiterQuote({
            ...params,
            slippageBps
          })
        } catch (error) {
          reportToSentry({
            name: 'JupiterSwapQuoteError',
            error: error as Error,
            feature: Feature.TanQuery,
            additionalInfo: { params }
          })
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.QUOTE_FAILED,
              message: 'Failed to get swap quote'
            }
          }
        }

        // Step 3: Initialize Jupiter client for swap instructions
        const jupiter = createJupiterApiClient()
        const outputToken = TOKEN_LISTING_MAP[params.outputTokenSymbol]
        const userPublicKey = new PublicKey(keypair.publicKey.toBase58())

        // Step 4: Check if user has an associated token account for the output token
        // and create one if it doesn't exist
        const sdk = await audiusSdk()
        const connection = sdk.services.solanaClient.connection

        // Get destination token account address
        const destinationTokenAccount = getAssociatedTokenAddressSync(
          new PublicKey(outputToken.address),
          userPublicKey
        )

        // Check if the associated token account exists
        let destinationTokenAccountExists = false
        try {
          await connection.getAccountInfo(destinationTokenAccount)
          destinationTokenAccountExists = true
        } catch (e) {
          destinationTokenAccountExists = false
        }

        // Step 5: Get swap instructions from Jupiter
        const swapResponse = await jupiter.swapInstructionsPost({
          swapRequest: {
            quoteResponse: quoteResult.quote,
            userPublicKey: userPublicKey.toString(),
            destinationTokenAccount: destinationTokenAccount.toString(),
            wrapAndUnwrapSol: true,
            useSharedAccounts: true
          }
        })

        // Step 6: Build the transaction
        const instructions: TransactionInstruction[] = []

        // If destination token account doesn't exist, create it
        if (!destinationTokenAccountExists) {
          instructions.push(
            createAssociatedTokenAccountInstruction(
              userPublicKey,
              destinationTokenAccount,
              userPublicKey,
              new PublicKey(outputToken.address)
            )
          )
        }

        // Add Jupiter instructions
        const jupiterInstructions = [
          swapResponse.tokenLedgerInstruction,
          ...swapResponse.computeBudgetInstructions,
          ...swapResponse.setupInstructions,
          swapResponse.swapInstruction,
          swapResponse.cleanupInstruction
        ]
          .filter(
            (instruction): instruction is Instruction =>
              instruction !== undefined
          )
          .map(parseJupiterInstruction)

        instructions.push(...jupiterInstructions)

        // Step 7: Create and sign the transaction
        const transaction = new Transaction()
        transaction.add(...instructions)
        transaction.feePayer = userPublicKey

        // Get the latest blockhash
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash

        // Sign the transaction
        transaction.sign(keypair)

        // Step 8: Send the transaction
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          { skipPreflight: false }
        )

        // Step 9: Confirm the transaction
        try {
          await connection.confirmTransaction(signature, 'confirmed')

          // Invalidate balance queries
          queryClient.invalidateQueries({ queryKey: ['audioBalance'] })
          queryClient.invalidateQueries({ queryKey: ['usdcBalance'] })

          return {
            status: SwapStatus.SUCCESS,
            signature,
            inputAmount: quoteResult.inputAmount,
            outputAmount: quoteResult.outputAmount
          }
        } catch (error) {
          // Check if error is due to slippage
          if (
            error instanceof Error &&
            error.message.includes(SLIPPAGE_TOLERANCE_EXCEEDED_ERROR.toString())
          ) {
            return {
              status: SwapStatus.ERROR,
              signature,
              error: {
                type: SwapErrorType.SLIPPAGE_EXCEEDED,
                message: 'Slippage tolerance exceeded'
              },
              inputAmount: quoteResult.inputAmount,
              outputAmount: quoteResult.outputAmount
            }
          }

          reportToSentry({
            name: 'JupiterSwapConfirmationError',
            error: error as Error,
            feature: Feature.TanQuery,
            additionalInfo: { signature, params }
          })

          return {
            status: SwapStatus.ERROR,
            signature,
            error: {
              type: SwapErrorType.TRANSACTION_FAILED,
              message: 'Transaction failed'
            },
            inputAmount: quoteResult.inputAmount,
            outputAmount: quoteResult.outputAmount
          }
        }
      } catch (error) {
        reportToSentry({
          name: 'JupiterSwapError',
          error: error as Error,
          feature: Feature.TanQuery,
          additionalInfo: { params }
        })

        return {
          status: SwapStatus.ERROR,
          error: {
            type: SwapErrorType.UNKNOWN,
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    },
    onMutate: () => {
      return {
        status: SwapStatus.GETTING_QUOTE
      }
    }
  })
}
