import { createCloseAccountInstruction } from '@solana/spl-token'
import {
  PublicKey,
  TransactionInstruction,
  VersionedTransaction
} from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useCurrentAccountUser, useQueryContext } from '~/api'
import { Feature } from '~/models'
import {
  convertJupiterInstructions,
  getJupiterQuoteByMint,
  jupiterInstance
} from '~/services/Jupiter'

import { QUERY_KEYS } from '../queryKeys'

import { createUserBankManagedTokens } from './constants'
import { updateAudioBalanceOptimistically } from './optimisticUpdates'
import {
  SwapErrorType,
  SwapStatus,
  SwapTokensParams,
  SwapTokensResult
} from './types'
import { addUserBankToAtaInstructions, getSwapErrorResponse } from './utils'

/**
 * Hook for executing token swaps using Jupiter.
 * Swaps any supported SPL token (or SOL) for another.
 */
export const useSwapTokens = () => {
  const queryClient = useQueryClient()
  const { solanaWalletService, reportToSentry, audiusSdk, env } =
    useQueryContext()
  const { data: user } = useCurrentAccountUser()

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
      let errorStage = 'UNKNOWN'
      const instructions: TransactionInstruction[] = []

      try {
        // ---------- 1. Initialize Dependencies & Wallet ----------
        errorStage = 'WALLET_INITIALIZATION'
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
        const feePayer = await sdk.services.solanaClient.getFeePayer()
        const ethAddress = user?.wallet

        // ---------- 2. Get Quote from Jupiter ----------
        errorStage = 'QUOTE_RETRIEVAL'
        quoteResult = await getJupiterQuoteByMint({
          inputMint: inputMintUiAddress,
          outputMint: outputMintUiAddress,
          amountUi,
          slippageBps,
          swapMode: 'ExactIn',
          onlyDirectRoutes: true
        })

        // ---------- 3. Prepare Transaction Instructions ----------
        const userBankManagedTokens = createUserBankManagedTokens(env)
        const inputTokenConfig =
          userBankManagedTokens[inputMintUiAddress.toUpperCase()]
        const outputTokenConfig =
          userBankManagedTokens[outputMintUiAddress.toUpperCase()]

        // --- 3a. Handle Input Token (if user bank managed) ---
        errorStage = 'INPUT_TOKEN_PREPARATION'

        const sourceAtaForJupiter = await addUserBankToAtaInstructions({
          tokenInfo: inputTokenConfig!,
          userPublicKey,
          ethAddress: ethAddress!,
          amountLamports: BigInt(quoteResult.inputAmount.amount),
          sdk,
          feePayer,
          instructions
        })

        // --- 3b. Determine Jupiter's Destination Token Account ---
        errorStage = 'OUTPUT_TOKEN_PREPARATION'

        const result =
          await sdk.services.claimableTokensClient.getOrCreateUserBank({
            ethWallet: ethAddress!,
            mint: outputTokenConfig!.claimableTokenMint
          })
        const outputUserBankAddress = result.userBank
        const preferredJupiterDestination = outputUserBankAddress.toBase58()

        // --- 3c. Get Jupiter Swap Instructions ---
        errorStage = 'SWAP_INSTRUCTION_RETRIEVAL'
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

        instructions.push(...jupiterInstructions)

        // --- 3f. Add Cleanup Instructions for Temporary ATAs ---
        const atasToClose: PublicKey[] = []

        // Add source ATA if it's temporary
        if (sourceAtaForJupiter) {
          atasToClose.push(sourceAtaForJupiter)
        }

        // Add close account instructions for all ATAs that need to be closed
        for (const ataToClose of atasToClose) {
          instructions.push(
            createCloseAccountInstruction(ataToClose, feePayer, userPublicKey)
          )
        }

        // ---------- 4. Build and Sign Transaction ----------
        errorStage = 'TRANSACTION_BUILD'
        const swapTx: VersionedTransaction =
          await sdk.services.solanaClient.buildTransaction({
            feePayer,
            instructions,
            addressLookupTables: addressLookupTableAddresses.map(
              (addr: string) => new PublicKey(addr)
            )
          })

        swapTx.sign([keypair])

        // ---------- 5. Send Transaction ----------
        errorStage = 'TRANSACTION_RELAY'
        signature = await sdk.services.solanaClient.sendTransaction(swapTx)

        // ---------- 6. Success & Invalidation ----------
        if (user?.wallet) {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.usdcBalance, user.wallet]
          })
        }
        if (user?.spl_wallet) {
          updateAudioBalanceOptimistically(
            queryClient,
            params,
            quoteResult?.outputAmount?.uiAmount,
            user.spl_wallet
          )
        }

        return {
          status: SwapStatus.SUCCESS,
          signature,
          inputAmount: quoteResult.inputAmount,
          outputAmount: quoteResult.outputAmount
        }
      } catch (error: unknown) {
        reportToSentry({
          name: `JupiterSwap${errorStage}Error`,
          error: error as Error,
          feature: Feature.TanQuery,
          additionalInfo: {
            params,
            signature,
            quoteResponse: quoteResult?.quote
          }
        })

        return getSwapErrorResponse({
          errorStage,
          error: error as Error,
          inputAmount: quoteResult?.inputAmount,
          outputAmount: quoteResult?.outputAmount
        })
      }
    },
    onMutate: () => {
      return { status: SwapStatus.SENDING_TRANSACTION }
    }
  })
}
