import {
  getWalletAudioBalanceQueryKey,
  useQueryContext
} from '@audius/common/api'
import { Chain, ErrorLevel, Feature } from '@audius/common/models'
import { getExternalWalletBalanceQueryKey } from '@audius/common/src/api/tan-query/wallets/useExternalWalletBalance'
import {
  getJupiterQuoteByMintWithRetry,
  jupiterInstance
} from '@audius/common/src/services/Jupiter'
import { AUDIO, FixedDecimal, type AudioWei } from '@audius/fixed-decimal'
import { SwapRequest } from '@jup-ag/api'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import { VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { appkitModal } from 'app/ReownAppKitModal'
import { reportToSentry } from 'store/errors/reportToSentry'

type ExternalWalletSwapParams = {
  inputAmountUi: number
  inputToken: { decimals: number; address: string }
  outputToken: { decimals: number; address: string }
  walletAddress: string
  isAMM: boolean
}
export const useExternalWalletSwap = () => {
  const { audiusSdk, env } = useQueryContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: ExternalWalletSwapParams) => {
      const hookProgress = {
        receivedQuote: false,
        receivedSwapTx: false,
        sentSwapTx: false,
        confirmedSwapTx: false,
        userCancelled: false
      }
      const {
        inputAmountUi,
        inputToken,
        outputToken,
        walletAddress,
        isAMM = false
      } = params

      try {
        const sdk = await audiusSdk()
        const appKitSolanaProvider =
          appkitModal.getProvider<SolanaProvider>('solana')

        if (!appKitSolanaProvider) {
          throw new Error('Missing appKitSolanaProvider')
        }
        // Get jupiter quote first
        const { quoteResult: quote } = await getJupiterQuoteByMintWithRetry({
          inputMint: inputToken.address,
          outputMint: outputToken.address,
          inputDecimals: inputToken.decimals,
          outputDecimals: outputToken.decimals,
          amountUi: inputAmountUi,
          swapMode: 'ExactIn',
          onlyDirectRoutes: false
        })

        hookProgress.receivedQuote = true

        // Generate a jupiter swap TX
        const swapRequest: SwapRequest = {
          quoteResponse: quote.quote,
          userPublicKey: walletAddress,
          dynamicSlippage: true, // Uses the slippage from the quote
          useSharedAccounts: !isAMM // Shared accounts cant be used for AMM pool swaps
        }
        const swapTx = await jupiterInstance.swapPost({ swapRequest })

        hookProgress.receivedSwapTx = true

        // Deserialize the base64-encoded transaction
        const decoded = Buffer.from(swapTx.swapTransaction, 'base64')
        const transaction = VersionedTransaction.deserialize(decoded)

        const txSignature =
          await appKitSolanaProvider.signAndSendTransaction(transaction)
        hookProgress.sentSwapTx = true

        await sdk.services.solanaClient.connection.confirmTransaction(
          txSignature,
          'confirmed'
        )
        hookProgress.confirmedSwapTx = true

        return {
          signature: txSignature,
          inputAmount: inputAmountUi,
          outputAmount: quote.outputAmount.uiAmount,
          progress: hookProgress,
          isError: false
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.error('External wallet swap failed:', error)

        if (errorMessage.includes('User rejected')) {
          hookProgress.userCancelled = true
        }

        reportToSentry({
          error: error instanceof Error ? error : new Error(errorMessage),
          level: ErrorLevel.Error,
          feature: Feature.ArtistCoins,
          name: 'External Wallet Swap Error',
          additionalInfo: {
            ...params,
            progress: hookProgress
          }
        })

        // We return the values here instead of throwing because we want to know if the error was due to a user cancellation or not
        return { progress: hookProgress, isError: true }
      }
    },
    onSuccess: (result, params) => {
      if (!result.isError) {
        // Update external wallet balances optimistically

        // Update input token balance (subtract the amount spent)
        if (result.inputAmount) {
          const inputTokenQueryKey = getExternalWalletBalanceQueryKey({
            walletAddress: params.walletAddress,
            mint: params.inputToken.address
          })

          queryClient.setQueryData(
            inputTokenQueryKey,
            (oldBalance: FixedDecimal | undefined) => {
              if (!oldBalance) return oldBalance
              const currentAmount = Number(oldBalance.toString())
              const inputAmount = result.inputAmount!
              const newAmount = Math.max(0, currentAmount - inputAmount) // Ensure non-negative
              return new FixedDecimal(newAmount, oldBalance.decimalPlaces)
            }
          )
        }

        // Update output token balance (add the amount received)
        if (result.outputAmount) {
          const outputTokenQueryKey = getExternalWalletBalanceQueryKey({
            walletAddress: params.walletAddress,
            mint: params.outputToken.address
          })

          queryClient.setQueryData(
            outputTokenQueryKey,
            (oldBalance: FixedDecimal | undefined) => {
              if (!oldBalance) {
                // If no previous balance, create a new FixedDecimal with the output amount
                return new FixedDecimal(
                  result.outputAmount!,
                  params.outputToken.decimals
                )
              }
              const currentAmount = Number(oldBalance.toString())
              const outputAmount = result.outputAmount!
              const newAmount = currentAmount + outputAmount
              return new FixedDecimal(newAmount, oldBalance.decimalPlaces)
            }
          )
        }

        // AUDIO balance is stored in a different query hook
        const isSpendingAudio =
          params.inputToken.address === env.WAUDIO_MINT_ADDRESS
        const isReceivingAudio =
          params.outputToken.address === env.WAUDIO_MINT_ADDRESS

        if (isSpendingAudio || isReceivingAudio) {
          // Update the wallet AUDIO balance based on the swap direction
          const queryKey = getWalletAudioBalanceQueryKey({
            address: params.walletAddress,
            chain: Chain.Sol
          })

          queryClient.setQueryData(
            queryKey,
            (oldBalance: AudioWei | undefined) => {
              const currentBalance = oldBalance ?? AUDIO(0).value
              let newBalance = currentBalance

              // If spending AUDIO (input token), subtract the input amount
              if (isSpendingAudio && result.inputAmount) {
                const inputAmountAudio = AUDIO(result.inputAmount).value
                newBalance = AUDIO(newBalance - inputAmountAudio).value
              }

              // If receiving AUDIO (output token), add the output amount
              if (isReceivingAudio && result.outputAmount) {
                const outputAmountAudio = AUDIO(result.outputAmount).value
                newBalance = AUDIO(newBalance + outputAmountAudio).value
              }

              // Ensure balance doesn't go negative
              return newBalance >= 0 ? newBalance : AUDIO(0).value
            }
          )
        }
      }
    }
  })
}
