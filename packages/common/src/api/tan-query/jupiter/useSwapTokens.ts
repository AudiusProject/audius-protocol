import { createCloseAccountInstruction } from '@solana/spl-token'
import {
  PublicKey,
  TransactionInstruction,
  VersionedTransaction
} from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useGetCurrentUser } from '~/api'
import { useAudiusQueryContext } from '~/audius-query'
import { Feature } from '~/models'
import {
  convertJupiterInstructions,
  getJupiterQuoteByMint,
  jupiterInstance
} from '~/services/Jupiter'

import { QUERY_KEYS } from '../queryKeys'

import { USER_BANK_MANAGED_TOKENS } from './constants'
import {
  SwapErrorType,
  SwapStatus,
  SwapTokensParams,
  SwapTokensResult
} from './types'
import {
  addAtaToUserBankInstructions,
  addUserBankToAtaInstructions,
  findActualJupiterDestination,
  findJupiterTemporarySetupAta,
  updateJupiterAtaCreationFeePayer
} from './utils'

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
      const {
        inputMint: inputMintUiAddress,
        outputMint: outputMintUiAddress,
        amountUi
      } = params
      const slippageBps = params.slippageBps ?? 50
      const wrapUnwrapSol = params.wrapUnwrapSol ?? true

      let quoteResult
      let signature: string | undefined
      const instructions: TransactionInstruction[] = []

      try {
        // ---------- 1. Initialize Dependencies & Wallet ----------
        const [sdk, keypair] = await Promise.all([
          audiusSdk(),
          solanaWalletService.getKeypair()
        ])

        if (!keypair) {
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.WALLET_ERROR,
              message: 'Wallet not initialised'
            }
          }
        }
        const userPublicKey = keypair.publicKey
        const feePayer = await sdk.services.solanaRelay.getFeePayer()
        const ethAddress = user?.wallet

        // ---------- 2. Get Quote from Jupiter ----------
        try {
          quoteResult = await getJupiterQuoteByMint({
            inputMint: inputMintUiAddress,
            outputMint: outputMintUiAddress,
            amountUi,
            slippageBps,
            swapMode: 'ExactIn',
            onlyDirectRoutes: true
          })
        } catch (error: any) {
          reportToSentry({
            name: 'JupiterSwapQuoteError',
            error,
            feature: Feature.TanQuery,
            additionalInfo: { params }
          })
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.QUOTE_FAILED,
              message: error?.message ?? 'Failed to get swap quote'
            }
          }
        }

        // ---------- 3. Prepare Transaction Instructions ----------
        const inputTokenConfig =
          USER_BANK_MANAGED_TOKENS[inputMintUiAddress.toUpperCase()]
        const outputTokenConfig =
          USER_BANK_MANAGED_TOKENS[outputMintUiAddress.toUpperCase()]

        let sourceAtaForJupiter: PublicKey | undefined
        let isSourceAtaTemporary = false

        // --- 3a. Handle Input Token (if user bank managed) ---
        const isInputUserBankManaged = !!(
          inputTokenConfig &&
          ethAddress &&
          inputMintUiAddress.toUpperCase() !== 'SOL'
        )
        if (isInputUserBankManaged) {
          try {
            sourceAtaForJupiter = await addUserBankToAtaInstructions({
              tokenInfo: inputTokenConfig!,
              userPublicKey,
              ethAddress: ethAddress!,
              amountLamports: BigInt(quoteResult.inputAmount.amount),
              sdk,
              feePayer,
              instructions
            })
            isSourceAtaTemporary = true
          } catch (error: any) {
            reportToSentry({
              name: 'JupiterSwapInputPrepError',
              error,
              feature: Feature.TanQuery,
              additionalInfo: { params }
            })
            return {
              status: SwapStatus.ERROR,
              error: {
                type: SwapErrorType.BUILD_FAILED,
                message: `Failed to prepare input token ${inputTokenConfig!.claimableTokenMint}: ${error.message}`
              },
              inputAmount: quoteResult.inputAmount,
              outputAmount: quoteResult.outputAmount
            }
          }
        }

        // --- 3b. Determine Jupiter's Destination Token Account ---
        let preferredJupiterDestination: string | undefined
        let outputUserBankAddress: PublicKey | undefined

        const isOutputUserBankManaged = !!(
          outputTokenConfig &&
          ethAddress &&
          outputMintUiAddress.toUpperCase() !== 'SOL'
        )
        if (isOutputUserBankManaged) {
          try {
            outputUserBankAddress =
              await sdk.services.claimableTokensClient.deriveUserBank({
                ethWallet: ethAddress!,
                mint: outputTokenConfig!.claimableTokenMint
              })
            preferredJupiterDestination = outputUserBankAddress.toBase58()
          } catch (error: any) {
            reportToSentry({
              name: 'JupiterSwapOutputUserBankDerivationError',
              error,
              feature: Feature.TanQuery,
              additionalInfo: { params }
            })
          }
        }

        // --- 3c. Get Jupiter Swap Instructions ---
        const {
          tokenLedgerInstruction,
          swapInstruction,
          addressLookupTableAddresses
        } = await jupiterInstance.swapInstructionsPost({
          swapRequest: {
            quoteResponse: quoteResult.quote,
            userPublicKey: userPublicKey.toBase58(),
            destinationTokenAccount: preferredJupiterDestination,
            wrapAndUnwrapSol: wrapUnwrapSol,
            useSharedAccounts: true
          }
        })

        const jupiterInstructions = convertJupiterInstructions([
          tokenLedgerInstruction,
          swapInstruction
        ])

        updateJupiterAtaCreationFeePayer(
          jupiterInstructions,
          userPublicKey,
          feePayer
        )
        instructions.push(...jupiterInstructions)

        // --- 3d. Identify Actual Jupiter Destination & Potential Jupiter-Created Temporary ATA ---
        const actualJupiterDestination =
          findActualJupiterDestination(jupiterInstructions)
        const jupiterTemporarySetupAta = outputTokenConfig
          ? findJupiterTemporarySetupAta(
              jupiterInstructions,
              outputTokenConfig.mintAddress,
              actualJupiterDestination
            )
          : undefined

        // --- 3e. Handle Output Token (if user bank managed and not directly deposited by Jupiter) ---
        let wasOutputDepositedToUserBank = false
        if (
          outputUserBankAddress &&
          actualJupiterDestination?.equals(outputUserBankAddress)
        ) {
          wasOutputDepositedToUserBank = true
        }

        const needsManualTransferToOutputUserBank =
          isOutputUserBankManaged &&
          actualJupiterDestination &&
          !wasOutputDepositedToUserBank

        if (needsManualTransferToOutputUserBank) {
          try {
            await addAtaToUserBankInstructions({
              tokenInfo: outputTokenConfig!,
              userPublicKey,
              ethAddress: ethAddress!,
              amountLamports: BigInt(quoteResult.outputAmount.amount),
              sourceAta: actualJupiterDestination!,
              sdk,
              feePayer,
              instructions
            })
            wasOutputDepositedToUserBank = true
          } catch (error: any) {
            reportToSentry({
              name: 'JupiterSwapOutputPostProcessError',
              error,
              feature: Feature.TanQuery,
              additionalInfo: { params }
            })
          }
        }

        // --- 3f. Add Cleanup Instructions for Temporary ATAs ---
        const atasToClose: PublicKey[] = []

        // Add source ATA if it's temporary
        if (sourceAtaForJupiter && isSourceAtaTemporary) {
          atasToClose.push(sourceAtaForJupiter)
        }

        // Determine if Jupiter setup ATA should be closed
        const shouldCloseJupiterSetupAta =
          jupiterTemporarySetupAta &&
          (!actualJupiterDestination ||
            !jupiterTemporarySetupAta.equals(actualJupiterDestination)) &&
          !(
            needsManualTransferToOutputUserBank &&
            actualJupiterDestination &&
            jupiterTemporarySetupAta.equals(actualJupiterDestination)
          )

        if (shouldCloseJupiterSetupAta) {
          atasToClose.push(jupiterTemporarySetupAta!)
        }

        // Add close account instructions for all ATAs that need to be closed
        for (const ataToClose of atasToClose) {
          instructions.push(
            createCloseAccountInstruction(ataToClose, feePayer, userPublicKey)
          )
        }

        // ---------- 4. Build and Sign Transaction ----------
        let swapTx: VersionedTransaction
        try {
          swapTx = await sdk.services.solanaClient.buildTransaction({
            feePayer,
            instructions,
            addressLookupTables: addressLookupTableAddresses.map(
              (addr: string) => new PublicKey(addr)
            )
          })
        } catch (error: any) {
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
              message: error?.message ?? 'Failed to build transaction'
            },
            inputAmount: quoteResult.inputAmount,
            outputAmount: quoteResult.outputAmount
          }
        }

        swapTx.sign([keypair])

        // ---------- 5. Send Transaction ----------
        try {
          signature = await sdk.services.solanaClient.sendTransaction(swapTx, {
            skipPreflight: true
          })
        } catch (error: any) {
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
        if (user?.wallet) {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.usdcBalance, user.wallet]
          })
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.audioBalance]
          })
        }

        return {
          status: SwapStatus.SUCCESS,
          signature,
          inputAmount: quoteResult.inputAmount,
          outputAmount: quoteResult.outputAmount
        }
      } catch (error: any) {
        reportToSentry({
          name: 'JupiterSwapUnknownError',
          error,
          feature: Feature.TanQuery,
          additionalInfo: { params, signature }
        })
        return {
          status: SwapStatus.ERROR,
          error: {
            type: SwapErrorType.UNKNOWN,
            message: error?.message ?? 'An unknown error occurred'
          }
        }
      }
    },
    onMutate: () => {
      return { status: SwapStatus.SENDING_TRANSACTION }
    }
  })
}
