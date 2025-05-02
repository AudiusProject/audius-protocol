import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAudiusQueryContext } from '~/audius-query'
import { Feature } from '~/models'
import { getJupiterQuoteByMint, JupiterTokenExchange } from '~/services/Jupiter'

// Enums and Types defined earlier in the provided context
export enum SwapStatus {
  IDLE = 'IDLE',
  GETTING_QUOTE = 'GETTING_QUOTE',
  BUILDING_TRANSACTION = 'BUILDING_TRANSACTION', // Added for clarity
  RELAYING_TRANSACTION = 'RELAYING_TRANSACTION', // Added for clarity
  CONFIRMING_TRANSACTION = 'CONFIRMING_TRANSACTION',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum SwapErrorType {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE', // Good to add pre-check later
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED', // Generic relay/confirm failure
  WALLET_ERROR = 'WALLET_ERROR', // e.g., couldn't get keypair
  QUOTE_FAILED = 'QUOTE_FAILED', // Jupiter API quote failure
  BUILD_FAILED = 'BUILD_FAILED', // Failed during instruction/tx build
  RELAY_FAILED = 'RELAY_FAILED', // Relay service specific error
  UNKNOWN = 'UNKNOWN'
}

// Use the more generic params structure
export type SwapTokensParams = {
  inputMint: string // SPL mint address or 'SOL'
  outputMint: string // SPL mint address or 'SOL'
  /** Amount of input token in UI units (e.g., 1.5 SOL, 10 AUDIO) */
  amountUi: number
  /** Slippage tolerance in basis points (e.g., 50 = 0.5%). Defaults to 50. */
  slippageBps?: number
  /** Allow Jupiter to wrap/unwrap SOL automatically. Defaults to true. */
  wrapUnwrapSol?: boolean
  // Add computeUnitPriceMicroLamports if needed, defaults usually fine
  // computeUnitPriceMicroLamports?: number;
}

export type SwapTokensResult = {
  status: SwapStatus
  signature?: string
  error?: {
    type: SwapErrorType
    message: string
  }
  // Keep input/output amounts for display/confirmation
  inputAmount?: {
    amount: number // Lamports/Wei
    uiAmount: number // User-friendly units
  }
  outputAmount?: {
    amount: number // Lamports/Wei
    uiAmount: number // User-friendly units
  }
}

/**
 * Hook for executing token swaps using Jupiter.
 * Swaps any supported SPL token (or SOL) for another.
 */
export const useSwapTokens = () => {
  const queryClient = useQueryClient()
  const { solanaWalletService, reportToSentry, audiusSdk } =
    useAudiusQueryContext()

  return useMutation<SwapTokensResult, Error, SwapTokensParams>({
    mutationFn: async (params): Promise<SwapTokensResult> => {
      const { inputMint, outputMint, amountUi } = params
      // Default slippage is 50 basis points (0.5%)
      const slippageBps = params.slippageBps ?? 50
      const wrapUnwrapSol = params.wrapUnwrapSol ?? true

      let quoteResult
      let signature: string | undefined

      try {
        // ---------- 1. Get Wallet Keypair ----------
        const keypair = await solanaWalletService.getKeypair()
        if (!keypair) {
          console.error('useSwapTokens: Wallet not initialised')
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.WALLET_ERROR,
              message: 'Wallet not initialised'
            }
          }
        }
        const userPublicKey = keypair.publicKey

        // ---------- 2. Get Quote from Jupiter ----------
        try {
          quoteResult = await getJupiterQuoteByMint({
            inputMint,
            outputMint,
            amountUi,
            slippageBps,
            swapMode: 'ExactIn'
          })
        } catch (error: any) {
          console.error('useSwapTokens: Error getting Jupiter quote:', error)
          reportToSentry({
            name: 'JupiterSwapQuoteError',
            error,
            feature: Feature.TanQuery, // Or a more specific feature
            additionalInfo: { params }
          })
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.QUOTE_FAILED,
              message: error?.message ?? 'Failed to get swap quote from Jupiter'
            }
          }
        }

        // ---------- 3. Build Transaction ----------
        let swapTx: VersionedTransaction
        const sdk = await audiusSdk()
        try {
          const { instructions, lookupTableAddresses } =
            await JupiterTokenExchange.getSwapInstructions({
              quote: quoteResult.quote,
              userPublicKey: userPublicKey.toBase58(),
              wrapAndUnwrapSol: wrapUnwrapSol
            })

          const feePayer = await sdk.services.solanaRelay.getFeePayer()

          // Build the transaction with the pre-converted instructions
          swapTx = await sdk.services.solanaClient.buildTransaction({
            feePayer,
            instructions,
            addressLookupTables: lookupTableAddresses.map(
              (address: string) => new PublicKey(address)
            ),
            priorityFee: null,
            computeLimit: null
          })
        } catch (error: any) {
          console.error('useSwapTokens: Error building transaction:', error)
          reportToSentry({
            name: 'JupiterSwapBuildError',
            error,
            feature: Feature.TanQuery,
            additionalInfo: { params, quoteResponse: quoteResult.quote }
          })
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.BUILD_FAILED,
              message: error?.message ?? 'Failed to build swap transaction'
            },
            inputAmount: quoteResult.inputAmount,
            outputAmount: quoteResult.outputAmount
          }
        }

        // ---------- 4. Sign Transaction ----------
        // The Audius relay requires the fee payer (slot 0) signature to be cleared
        // and the transaction to be signed by the actual user (which we do here).
        // The relay service will then sign as the fee payer.
        swapTx.sign([keypair])

        // ---------- Debug: Log transaction instructions ----------
        try {
          const message = swapTx.message
          // For v0 transactions, use compiledInstructions and staticAccountKeys
          const programIds = message.compiledInstructions.map((ix) => {
            // Map programIdIndex to staticAccountKeys if available
            const programId =
              message.staticAccountKeys?.[ix.programIdIndex]?.toBase58?.() ||
              `idx:${ix.programIdIndex}`
            return programId
          })
          // Print all program IDs in order
          console.debug(
            'SWAP RELAY DEBUG: Transaction program IDs:',
            programIds
          )
          // Optionally, print the raw instruction data for further debugging
          console.debug(
            'SWAP RELAY DEBUG: Compiled instructions:',
            message.compiledInstructions
          )
        } catch (e) {
          console.warn(
            'SWAP RELAY DEBUG: Failed to log transaction instructions',
            e
          )
        }

        // ---------- 5. Relay Transaction ----------
        try {
          const relayResult = await sdk.services.solanaRelay.relay({
            transaction: swapTx,
            sendOptions: { skipPreflight: false } // Preflight checks happen during build/quote
          })
          signature = relayResult.signature
        } catch (error: any) {
          console.error('useSwapTokens: Error relaying transaction:', error)
          reportToSentry({
            name: 'JupiterSwapRelayError',
            error,
            feature: Feature.TanQuery,
            additionalInfo: { params, quoteResponse: quoteResult.quote }
          })
          // Use the error message from the relay if available
          const relayErrorMessage =
            error?.response?.data?.error ?? error?.message
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.RELAY_FAILED,
              message: relayErrorMessage ?? 'Failed to relay swap transaction'
            },
            inputAmount: quoteResult.inputAmount,
            outputAmount: quoteResult.outputAmount
          }
        }

        // ---------- 6. Confirm Transaction ----------
        const connection = sdk.services.solanaClient.connection
        try {
          await connection.confirmTransaction(signature, 'confirmed')
        } catch (error: any) {
          console.error(
            `useSwapTokens: Transaction confirmation error (Sig: ${signature}):`,
            error
          )

          // Generic confirmation failure
          reportToSentry({
            name: 'JupiterSwapConfirmationError',
            error,
            feature: Feature.TanQuery,
            additionalInfo: { signature, params }
          })
          return {
            status: SwapStatus.ERROR,
            signature,
            error: {
              type: SwapErrorType.TRANSACTION_FAILED,
              message:
                error?.message ?? 'Failed to confirm swap transaction on-chain'
            },
            inputAmount: quoteResult.inputAmount,
            outputAmount: quoteResult.outputAmount
          }
        }

        // ---------- 7. Success & Invalidation ----------
        // Generate dynamic query keys based on mints
        // Assuming your balance hooks use keys like ['audioBalance', userId] or ['usdcBalance', userId]
        // We need a more generic pattern if swapping arbitrary tokens.
        // Example: ['tokenBalance', userId, mintAddress]
        // If using simpler keys like ['audioBalance'], adjust accordingly.
        // SOL balance might need invalidation too if SOL was input/output.
        const inputBalanceKey =
          inputMint === 'SOL' ? 'solBalance' : 'tokenBalance' // Adapt as needed
        const outputBalanceKey =
          outputMint === 'SOL' ? 'solBalance' : 'tokenBalance' // Adapt as needed

        queryClient.invalidateQueries({ queryKey: [inputBalanceKey] }) // Invalidate broadly for now
        queryClient.invalidateQueries({ queryKey: [outputBalanceKey] })
        // Or more specifically if your keys include the mint address:
        // queryClient.invalidateQueries({ queryKey: [inputBalanceKey, inputMint] });
        // queryClient.invalidateQueries({ queryKey: [outputBalanceKey, outputMint] });

        return {
          status: SwapStatus.SUCCESS,
          signature,
          inputAmount: quoteResult.inputAmount,
          outputAmount: quoteResult.outputAmount
        }
      } catch (error: any) {
        // Catch-all for unexpected errors during the process
        console.error('useSwapTokens: Unknown error during swap:', error)
        reportToSentry({
          name: 'JupiterSwapUnknownError',
          error,
          feature: Feature.TanQuery,
          additionalInfo: { params, signature } // Signature might be undefined here
        })
        return {
          status: SwapStatus.ERROR,
          error: {
            type: SwapErrorType.UNKNOWN,
            message: error?.message ?? 'An unknown error occurred during swap'
          }
        }
      }
    },
    // Provide initial status feedback
    onMutate: () => {
      return {
        status: SwapStatus.GETTING_QUOTE,
        inputAmount: undefined,
        outputAmount: undefined
      }
    },
    // Centralized error reporting for mutation failures
    onError: (error: Error, variables) => {
      // This catches errors thrown *before* returning a structured SwapTokensResult
      // (e.g., failure in `getKeypair`, or unhandled exceptions).
      // Errors handled *within* mutationFn return structured results and don't hit this onError.
      console.error(
        'useSwapTokens: Unhandled mutation error:',
        error,
        'with variables:',
        variables
      )
      reportToSentry({
        name: 'JupiterSwapUnhandledMutationError',
        error,
        feature: Feature.TanQuery,
        additionalInfo: { params: variables }
      })
      // Optionally, you could return a default error state here to update the mutation cache,
      // but usually, letting the mutation stay in 'error' state is sufficient.
    },
    // Add meta for React Query DevTools
    meta: { feature: 'Swap Tokens using Jupiter' }
  })
}
