import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getUserCoinQueryKey,
  useCurrentAccountUser,
  useQueryContext
} from '~/api'
import type { QueryContextType } from '~/api/tan-query/utils/QueryContext'
import { Feature } from '~/models'
import type { User } from '~/models/User'
import { JupiterQuoteResult } from '~/services/Jupiter'
import { useTokens } from '~/store/ui/buy-sell'
import { TOKEN_LISTING_MAP } from '~/store/ui/shared/tokenConstants'

import { executeDirectSwap } from './directSwap'
import { executeDoubleSwap } from './doubleSwap'
import {
  SwapDependencies,
  SwapErrorType,
  SwapStatus,
  SwapTokensParams,
  SwapTokensResult
} from './types'
import { getSwapErrorResponse } from './utils'

const AUDIO_MINT = TOKEN_LISTING_MAP.AUDIO.address

const initializeSwapDependencies = async (
  solanaWalletService: QueryContextType['solanaWalletService'],
  audiusSdk: QueryContextType['audiusSdk'],
  queryClient: ReturnType<typeof useQueryClient>,
  user: User | undefined
): Promise<SwapDependencies | { error: SwapTokensResult }> => {
  try {
    const [sdk, keypair] = await Promise.all([
      audiusSdk(),
      solanaWalletService.getKeypair()
    ])

    if (!keypair) {
      return {
        error: {
          status: SwapStatus.ERROR,
          error: {
            type: SwapErrorType.WALLET_ERROR,
            message: 'Wallet not initialised'
          }
        }
      }
    }

    const userPublicKey = keypair.publicKey
    const feePayer = await sdk.services.solanaClient.getFeePayer()
    const ethAddress = user?.wallet

    if (!ethAddress) {
      return {
        error: {
          status: SwapStatus.ERROR,
          error: {
            type: SwapErrorType.WALLET_ERROR,
            message: 'User wallet address not found'
          }
        }
      }
    }

    return {
      sdk,
      keypair,
      userPublicKey,
      feePayer,
      ethAddress,
      queryClient,
      user
    }
  } catch (error) {
    return {
      error: {
        status: SwapStatus.ERROR,
        error: {
          type: SwapErrorType.WALLET_ERROR,
          message: 'Failed to initialize wallet dependencies'
        }
      }
    }
  }
}

/**
 * Hook for executing token swaps using Jupiter.
 * Swaps any supported SPL token (or SOL) for another.
 */
export const useSwapTokens = () => {
  const queryClient = useQueryClient()
  const { solanaWalletService, reportToSentry, audiusSdk } = useQueryContext()
  const { data: user } = useCurrentAccountUser()
  const { tokens } = useTokens()

  return useMutation<SwapTokensResult, Error, SwapTokensParams>({
    mutationFn: async (params): Promise<SwapTokensResult> => {
      const { inputMint: inputMintUiAddress, outputMint: outputMintUiAddress } =
        params

      let errorStage = 'UNKNOWN'
      let firstQuoteResult: JupiterQuoteResult | undefined
      let secondQuoteResult: JupiterQuoteResult | undefined
      let signature: string | undefined

      try {
        // Initialize dependencies
        errorStage = 'WALLET_INITIALIZATION'
        const dependenciesResult = await initializeSwapDependencies(
          solanaWalletService,
          audiusSdk,
          queryClient,
          user
        )

        if ('error' in dependenciesResult) {
          return dependenciesResult.error
        }

        const dependencies = dependenciesResult

        // Check if this is a direct swap involving AUDIO
        const isInputAudio = inputMintUiAddress === AUDIO_MINT
        const isOutputAudio = outputMintUiAddress === AUDIO_MINT
        const isDirect = isInputAudio || isOutputAudio

        if (isDirect) {
          return await executeDirectSwap(params, dependencies, tokens)
        } else {
          return await executeDoubleSwap(params, dependencies, tokens)
        }
      } catch (error: unknown) {
        // Handle transaction size limit exceeded
        if (
          (error as Error).message?.includes('Transaction too large') ||
          (error as Error).message?.includes('1232')
        ) {
          return {
            status: SwapStatus.ERROR,
            error: {
              type: SwapErrorType.BUILD_FAILED,
              message:
                'Transaction too large for single transaction. Use two-transaction approach.'
            }
          }
        }

        reportToSentry({
          name: `JupiterSwap${errorStage}Error`,
          error: error as Error,
          feature: Feature.TanQuery,
          additionalInfo: {
            params,
            signature,
            firstQuoteResponse: firstQuoteResult?.quote,
            secondQuoteResponse: secondQuoteResult?.quote
          }
        })

        return getSwapErrorResponse({
          errorStage,
          error: error as Error,
          inputAmount: firstQuoteResult?.inputAmount,
          outputAmount:
            secondQuoteResult?.outputAmount || firstQuoteResult?.outputAmount
        })
      }
    },
    onSuccess: (result, params) => {
      const { inputMint, outputMint } = params
      const { inputAmount, outputAmount } = result
      if (inputMint) {
        queryClient.setQueryData(
          getUserCoinQueryKey(inputMint, user?.user_id),
          (prevAccountBalances) => {
            if (!prevAccountBalances) return null

            return {
              ...prevAccountBalances,
              // Update aggregate account balance (includes connected wallets)
              balance:
                prevAccountBalances?.balance - (inputAmount?.amount ?? 0),
              // Update internal wallet balance (we only do swaps against internal wallets)
              accounts: prevAccountBalances.accounts.map((account) =>
                account.isInAppWallet
                  ? {
                      ...account,
                      balance: account.balance - (inputAmount?.amount ?? 0)
                    }
                  : account
              )
            }
          }
        )
      }
      if (outputMint) {
        queryClient.setQueryData(
          getUserCoinQueryKey(outputMint, user?.user_id),
          (prevAccountBalances) => {
            if (!prevAccountBalances) return null

            return {
              ...prevAccountBalances,
              // Update aggregate account balance (includes connected wallets)
              balance:
                prevAccountBalances?.balance + (outputAmount?.amount ?? 0),
              // Update internal wallet balance (we only do swaps against internal wallets)
              accounts: prevAccountBalances.accounts.map((account) =>
                account.isInAppWallet
                  ? {
                      ...account,
                      balance: account.balance + (outputAmount?.amount ?? 0)
                    }
                  : account
              )
            }
          }
        )
      }
    },
    onMutate: () => {
      return { status: SwapStatus.SENDING_TRANSACTION }
    }
  })
}
