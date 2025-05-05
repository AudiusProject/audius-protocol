import {
  createCloseAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useGetCurrentUser } from '~/api'
import { useAudiusQueryContext } from '~/audius-query'
import { Feature } from '~/models'
import { getJupiterQuoteByMint, JupiterTokenExchange } from '~/services/Jupiter'
import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'

// Enums and Types defined earlier in the provided context
export enum SwapStatus {
  IDLE = 'IDLE',
  GETTING_QUOTE = 'GETTING_QUOTE',
  BUILDING_TRANSACTION = 'BUILDING_TRANSACTION', // Added for clarity
  SENDING_TRANSACTION = 'SENDING_TRANSACTION', // Updated from RELAYING_TRANSACTION
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
  SEND_FAILED = 'SEND_FAILED', // Failed to send transaction
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
  const { data: user } = useGetCurrentUser({})

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
        const sdk = await audiusSdk()

        // Get the transaction instructions from Jupiter
        const { instructions: jupiterInstructions, lookupTableAddresses } =
          await JupiterTokenExchange.getSwapInstructions({
            quote: quoteResult.quote,
            userPublicKey: userPublicKey.toBase58(),
            wrapAndUnwrapSol: wrapUnwrapSol
          })

        // Create a copy of the instructions array
        const instructions = [...jupiterInstructions]

        // Check if this is an AUDIO -> USDC swap using the tokens from constants
        const audioMintAddress = TOKEN_LISTING_MAP.AUDIO.address
        const usdcMintAddress = TOKEN_LISTING_MAP.USDC.address

        const isAudioToUsdc =
          inputMint.toUpperCase() === audioMintAddress.toUpperCase() &&
          outputMint.toUpperCase() === usdcMintAddress.toUpperCase()

        // For AUDIO -> USDC swaps, add instructions to transfer USDC to userbank and close ATA
        if (isAudioToUsdc && user?.wallet) {
          try {
            console.debug(
              'SWAP: Adding USDC userbank transfer for AUDIO -> USDC swap'
            )

            const ethAddress = user.wallet

            const usdcAssociatedTokenAccount = getAssociatedTokenAddressSync(
              new PublicKey(usdcMintAddress),
              userPublicKey,
              true
            )

            const userBank =
              await sdk.services.claimableTokensClient.deriveUserBank({
                ethWallet: ethAddress,
                mint: 'USDC'
              })

            const transferToUserbankInstruction = createTransferInstruction(
              usdcAssociatedTokenAccount,
              userBank,
              userPublicKey,
              BigInt(quoteResult.outputAmount.amount)
            )

            const closeAccountInstruction = createCloseAccountInstruction(
              usdcAssociatedTokenAccount,
              userPublicKey,
              userPublicKey,
              []
            )

            instructions.push(
              transferToUserbankInstruction,
              closeAccountInstruction
            )

            console.debug('SWAP: Added userbank transfer instructions', {
              usdcAta: usdcAssociatedTokenAccount.toBase58(),
              userBank: userBank.toBase58(),
              amount: quoteResult.outputAmount.amount
            })
          } catch (error) {
            console.error(
              'SWAP: Failed to add USDC userbank transfer instructions:',
              error
            )
            // Continue with the swap even if we can't add these instructions
            // Better to have USDC in an ATA than to fail the swap entirely
          }
        }

        const feePayer = await sdk.services.solanaRelay.getFeePayer()

        // Build the transaction with all instructions
        let swapTx: VersionedTransaction
        try {
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
        // The transaction needs to be signed by the actual user (which we do here).
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
          console.debug('SWAP DEBUG: Transaction program IDs:', programIds)
          // Optionally, print the raw instruction data for further debugging
          console.debug(
            'SWAP DEBUG: Compiled instructions:',
            message.compiledInstructions
          )
        } catch (e) {
          console.warn('SWAP DEBUG: Failed to log transaction instructions', e)
        }

        // ---------- 5. Send Transaction ----------
        try {
          signature = await sdk.services.solanaClient.sendTransaction(swapTx, {
            skipPreflight: false // Preflight checks happen during build/quote
          })
        } catch (error: any) {
          console.error('useSwapTokens: Error sending transaction:', error)
          reportToSentry({
            name: 'JupiterSwapSendError',
            error,
            feature: Feature.TanQuery,
            additionalInfo: { params, quoteResponse: quoteResult.quote }
          })
          // Use the error message if available
          const errorMessage = error?.message
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.SEND_FAILED,
              message: errorMessage ?? 'Failed to send swap transaction'
            },
            inputAmount: quoteResult.inputAmount,
            outputAmount: quoteResult.outputAmount
          }
        }

        // ---------- 6. Success & Invalidation ----------
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
