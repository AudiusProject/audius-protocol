import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import {
  PublicKey,
  TransactionInstruction,
  VersionedTransaction
} from '@solana/web3.js'
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
  WALLET_ERROR = 'WALLET_ERROR',
  QUOTE_FAILED = 'QUOTE_FAILED',
  BUILD_FAILED = 'BUILD_FAILED',
  RELAY_FAILED = 'RELAY_FAILED',
  SIMULATION_FAILED = 'SIMULATION_FAILED',
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
            swapMode: 'ExactIn',
            onlyDirectRoutes: true
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

        const audioMintAddress = TOKEN_LISTING_MAP.AUDIO.address
        const usdcMintAddress = TOKEN_LISTING_MAP.USDC.address

        // Create a copy of the instructions array for all transaction instructions
        const instructions: TransactionInstruction[] = []

        // Check if this is an AUDIO -> any token swap
        const isAudioSwap =
          inputMint.toUpperCase() === audioMintAddress.toUpperCase()
        const isAudioToUsdc =
          isAudioSwap &&
          outputMint.toUpperCase() === usdcMintAddress.toUpperCase()

        // For AUDIO based swaps, first transfer from user bank to standard ATA
        if (isAudioSwap && user?.wallet) {
          try {
            console.debug('SWAP: Setting up AUDIO transfer from user bank')
            const ethAddress = user.wallet

            // Create the AUDIO ATA if it doesn't already exist
            const audioMint = new PublicKey(audioMintAddress)
            const audioAta = getAssociatedTokenAddressSync(
              audioMint,
              userPublicKey,
              true
            )

            // Check if ATA exists before trying to create it
            try {
              await getAccount(sdk.services.solanaClient.connection, audioAta)
              console.debug('SWAP: Source AUDIO ATA already exists')
            } catch (e) {
              // If getAccount throws, ATA doesn't exist, add instruction to create
              console.debug(
                'SWAP: Source AUDIO ATA does not exist, adding create instruction'
              )
              const feePayer = await sdk.services.solanaRelay.getFeePayer()
              const createAudioAtaInstruction =
                createAssociatedTokenAccountIdempotentInstruction(
                  feePayer,
                  audioAta,
                  userPublicKey,
                  audioMint
                )
              instructions.push(createAudioAtaInstruction)
            }

            // Create instructions to transfer from userbank to ATA
            const secpTransferInstruction =
              await sdk.services.claimableTokensClient.createTransferSecpInstruction(
                {
                  amount: BigInt(quoteResult.inputAmount.amount),
                  ethWallet: ethAddress,
                  mint: 'wAUDIO',
                  destination: audioAta,
                  instructionIndex: instructions.length
                }
              )

            // Add the instruction to actually move the tokens
            const transferInstruction =
              await sdk.services.claimableTokensClient.createTransferInstruction(
                {
                  ethWallet: ethAddress,
                  mint: 'wAUDIO',
                  destination: audioAta
                  // No amount needed here, it uses the verified Secp amount
                }
              )
            instructions.push(secpTransferInstruction)
            instructions.push(transferInstruction)

            console.debug(
              'SWAP: Added AUDIO userbank to ATA secp + transfer instructions',
              {
                audioAta: audioAta.toBase58(),
                amount: BigInt(quoteResult.inputAmount.amount)
              }
            )
          } catch (error) {
            console.error(
              'SWAP: Failed to add AUDIO userbank transfer instructions:',
              error
            )
            return {
              status: SwapStatus.ERROR,
              error: {
                type: SwapErrorType.BUILD_FAILED,
                message: 'Failed to set up AUDIO transfer from user bank'
              },
              inputAmount: quoteResult.inputAmount,
              outputAmount: quoteResult.outputAmount
            }
          }
        }

        const feePayer = await sdk.services.solanaRelay.getFeePayer()

        // Pre-determine the USDC userbank for AUDIO -> USDC swaps to use as destination
        let usdcUserBank: PublicKey | undefined
        if (isAudioToUsdc && user?.wallet) {
          try {
            usdcUserBank =
              await sdk.services.claimableTokensClient.deriveUserBank({
                ethWallet: user.wallet,
                mint: 'USDC'
              })
            console.debug('SWAP: Using USDC userbank as destination', {
              userBank: usdcUserBank.toBase58()
            })
          } catch (error) {
            console.error('SWAP: Failed to derive USDC userbank:', error)
            // Continue with the swap even if we can't derive the userbank
            // We'll fall back to standard ATA in this case
          }
        }

        // Get the transaction instructions from Jupiter
        const { instructions: jupiterInstructions, lookupTableAddresses } =
          await JupiterTokenExchange.getSwapInstructions({
            quote: quoteResult.quote,
            userPublicKey: userPublicKey.toBase58(),
            destinationTokenAccount: usdcUserBank?.toBase58(), // Pass the userbank as destination for AUDIO -> USDC
            wrapAndUnwrapSol: wrapUnwrapSol
          })

        // Log the intended destination if we provided one
        console.debug('SWAP: Requested Jupiter destination:', {
          destination: usdcUserBank?.toBase58() ?? 'Default ATA'
        })

        // Find the actual Jupiter swap instruction to log the real destination
        const jupiterSwapInstruction = jupiterInstructions.find(
          (ix) =>
            ix.programId.toBase58() ===
            'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
        )
        let actualJupiterDestination: PublicKey | undefined
        if (jupiterSwapInstruction) {
          // Heuristic: In Jupiter's SharedAccountsRoute, the 6th key is often the final destination token account
          // A more robust method would involve decoding the specific instruction data based on its ID.
          const destKeyMeta = jupiterSwapInstruction.keys[6]
          if (destKeyMeta) {
            actualJupiterDestination = destKeyMeta.pubkey
            console.debug('SWAP: Actual Jupiter destination account:', {
              destination: actualJupiterDestination.toBase58()
            })
          } else {
            console.warn(
              'SWAP: Could not determine actual Jupiter destination account from keys.'
            )
          }
        } else {
          console.warn('SWAP: Could not find Jupiter swap instruction in list.')
        }

        // --- Modification Start ---
        // Find and update the fee payer for Jupiter's ATA creation instruction
        for (const ix of jupiterInstructions) {
          // Check if it's the Associated Token Program
          if (ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
            // Basic check for createAssociatedTokenAccountIdempotentInstruction:
            // It typically has 7 keys, and the first key is the fee payer.
            // We assume Jupiter might use the userPublicKey as the default fee payer here.
            if (
              ix.keys.length >= 1 && // Ensure keys exist
              ix.keys[0].pubkey.equals(userPublicKey) && // Check if fee payer is the user
              ix.keys[0].isSigner && // Fee payer must be a signer
              ix.keys[0].isWritable // Fee payer must be writable
            ) {
              console.debug(
                'SWAP: Updating fee payer for Jupiter ATA creation instruction'
              )
              // Update the first key (fee payer) to use the relay fee payer
              ix.keys[0].pubkey = feePayer
              // Ensure the user is no longer marked as signer/writable *for this instruction's fee payer role*
              // Find the user's key if it exists elsewhere in the instruction and ensure it's not the fee payer
              // Note: The userPublicKey *will* still be a signer for the overall transaction later.
              // This modification only changes who pays the fee *for this specific ATA instruction*.
              // We don't need to remove the user as a signer generally, just ensure the *first* key (fee payer) is correct.
              // A more robust check could involve decoding instruction data, but this heuristic is common.
              break // Assuming only one such instruction from Jupiter per swap
            }
          }
        }
        // --- Modification End ---

        // Find the ATA created by Jupiter's setup instruction for potential closure later
        let jupiterSetupAta: PublicKey | undefined
        const createAtaInstruction = jupiterInstructions.find(
          (ix) =>
            ix.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID) &&
            // Check keys length or instruction data for more specific match if needed
            ix.keys.length >= 4 && // Basic check for create instructions
            ix.keys[3].pubkey.toBase58() === usdcMintAddress // Check if it's for the USDC mint
        )
        if (createAtaInstruction) {
          jupiterSetupAta = createAtaInstruction.keys[1].pubkey // ATA address is typically the 2nd key
          console.debug('SWAP: Identified Jupiter setup ATA:', {
            ata: jupiterSetupAta.toBase58()
          })
        } else {
          console.warn(
            'SWAP: Could not identify Jupiter setup ATA instruction.'
          )
        }

        // Add Jupiter instructions (potentially modified) to our instruction array
        instructions.push(...jupiterInstructions)

        // Determine if we need the fallback transfer/close logic
        const needsFallback =
          isAudioToUsdc &&
          user?.wallet &&
          (!usdcUserBank ||
            !actualJupiterDestination ||
            !actualJupiterDestination.equals(usdcUserBank))

        // For AUDIO -> USDC swaps, add instructions to transfer USDC to userbank and close ATA
        // Only add these if we couldn't use the userbank as the direct destination
        if (needsFallback) {
          try {
            console.debug(
              'SWAP: Using fallback: Adding USDC transfer + close instructions.',
              {
                intendedUserBank: usdcUserBank?.toBase58(),
                actualJupiterDestination: actualJupiterDestination?.toBase58()
              }
            )

            const ethAddress = user.wallet

            // The source for this transfer is the actual destination Jupiter used
            const sourceAccount =
              actualJupiterDestination ??
              getAssociatedTokenAddressSync(
                new PublicKey(usdcMintAddress),
                userPublicKey,
                true
              )

            // The destination is always the userbank in the fallback
            const finalUserBankDestination =
              usdcUserBank ??
              (await sdk.services.claimableTokensClient.deriveUserBank({
                ethWallet: ethAddress,
                mint: 'USDC'
              }))

            // Use TransferChecked instead of Transfer
            const usdcMintPublicKey = new PublicKey(usdcMintAddress)
            const usdcDecimals = TOKEN_LISTING_MAP.USDC.decimals // Assuming decimals are available

            const transferToUserbankInstruction =
              createTransferCheckedInstruction(
                sourceAccount, // source (actual Jupiter destination)
                usdcMintPublicKey, // mint
                finalUserBankDestination, // destination (userbank)
                userPublicKey, // owner
                BigInt(quoteResult.outputAmount.amount), // amount
                usdcDecimals // decimals
              )

            const closeUsdcAccountInstruction = createCloseAccountInstruction(
              sourceAccount, // Close the actual Jupiter destination
              feePayer,
              userPublicKey
            )

            instructions.push(
              transferToUserbankInstruction,
              closeUsdcAccountInstruction
            )

            console.debug(
              'SWAP: Added fallback userbank transfer instructions',
              {
                source: sourceAccount.toBase58(),
                destination: finalUserBankDestination.toBase58(),
                amount: quoteResult.outputAmount.amount
              }
            )

            // For AUDIO swaps, optionally close the AUDIO ATA if we created it only for this swap
            // This needs to happen even in the fallback case
            if (isAudioSwap) {
              console.debug(
                'SWAP: Adding instruction to close AUDIO ATA after swap (fallback path)'
              )
              const audioAta = getAssociatedTokenAddressSync(
                new PublicKey(audioMintAddress),
                userPublicKey,
                true
              )

              const closeAudioAccountInstruction =
                createCloseAccountInstruction(audioAta, feePayer, userPublicKey)

              instructions.push(closeAudioAccountInstruction)
            }
          } catch (error) {
            console.error(
              'SWAP: Failed to add fallback USDC userbank transfer instructions:',
              error
            )
            // Continue with the swap even if we can't add these instructions
            // Better to have USDC in an ATA than to fail the swap entirely
          }
        }
        // Close AUDIO ATA if we used direct destination successfully
        else if (
          isAudioToUsdc &&
          isAudioSwap &&
          usdcUserBank &&
          actualJupiterDestination?.equals(usdcUserBank)
        ) {
          // Even if we're sending directly to userbank, we still need to close the AUDIO ATA
          // and the potentially orphaned ATA created by Jupiter's setup
          try {
            console.debug(
              'SWAP: Direct deposit successful. Adding instructions to close AUDIO ATA and Jupiter setup ATA.'
            )
            // Close AUDIO ATA
            const audioAta = getAssociatedTokenAddressSync(
              new PublicKey(audioMintAddress),
              userPublicKey,
              true
            )
            const closeAudioAccountInstruction = createCloseAccountInstruction(
              audioAta,
              feePayer,
              userPublicKey
            )
            instructions.push(closeAudioAccountInstruction)

            // Close Jupiter Setup ATA (if identified)
            if (jupiterSetupAta) {
              const closeJupiterSetupAtaInstruction =
                createCloseAccountInstruction(
                  jupiterSetupAta, // The ATA created by Jupiter's setup
                  feePayer, // Destination for rent refund
                  userPublicKey // Owner/Authority of the ATA
                )
              instructions.push(closeJupiterSetupAtaInstruction)
              console.debug(
                'SWAP: Added instruction to close Jupiter setup ATA',
                {
                  ata: jupiterSetupAta.toBase58()
                }
              )
            }
          } catch (error) {
            console.error(
              'SWAP: Failed to add ATA close instruction(s) (direct path):',
              error
            )
            // Continue with the swap even if we can't close the ATAs
          }
        }

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

        // ---------- 5. Send Transaction ----------
        try {
          signature = await sdk.services.solanaClient.sendTransaction(swapTx, {
            skipPreflight: true
          })
          console.debug(`Swap completed with signature: ${signature}`)
        } catch (error: any) {
          console.error('useSwapTokens: Failed to relay transaction', error)
          reportToSentry({
            name: 'JupiterSwapRelayError',
            error,
            feature: Feature.TanQuery,
            additionalInfo: {
              params,
              quoteResponse: quoteResult.quote
            }
          })
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.RELAY_FAILED,
              message: error?.message ?? 'Failed to relay transaction'
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
    onMutate: () => {
      return { status: SwapStatus.SENDING_TRANSACTION }
    }
  })
}
