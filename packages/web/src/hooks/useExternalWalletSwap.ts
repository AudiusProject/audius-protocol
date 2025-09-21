import {
  QUERY_KEYS,
  getWalletAudioBalanceQueryKey,
  useQueryContext
} from '@audius/common/api'
import { Chain, ErrorLevel, Feature } from '@audius/common/models'
import { getExternalWalletBalanceQueryKey } from '@audius/common/src/api/tan-query/wallets/useExternalWalletBalance'
import {
  getJupiterQuoteByMintWithRetry,
  jupiterInstance
} from '@audius/common/src/services/Jupiter'
import { SwapRequest } from '@jup-ag/api'
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react'
import { VersionedTransaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TokenInfo } from '~/store'

import { appkitModal } from 'app/ReownAppKitModal'
import { reportToSentry } from 'store/errors/reportToSentry'

type ExternalWalletSwapParams = {
  inputAmountUi: number
  inputToken: TokenInfo
  outputToken: TokenInfo
  walletAddress: string
}
export const useExternalWalletSwap = () => {
  const { audiusSdk } = useQueryContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: ExternalWalletSwapParams) => {
      const hookProgress = {
        receivedQuote: false,
        receivedSwapTx: false,
        sentSwapTx: false,
        confirmedSwapTx: false
      }
      const { inputAmountUi, inputToken, outputToken, walletAddress } = params

      try {
        const sdk = await audiusSdk()
        const appKitSolanaProvider =
          appkitModal.getProvider<SolanaProvider>('solana')

        if (!appKitSolanaProvider) {
          throw new Error('Missing appKitSolanaProvider')
        }
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
          useSharedAccounts: true
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
          inputToken: inputToken.symbol,
          outputToken: outputToken.symbol
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        console.error('External wallet swap failed:', error)

        reportToSentry({
          error: error instanceof Error ? error : new Error(errorMessage),
          level: ErrorLevel.Error,
          feature: Feature.TanQuery,
          name: 'External Wallet Swap Error',
          additionalInfo: {
            ...params,
            progress: hookProgress
          }
        })

        throw error
      }
    },
    onSuccess: (result, params) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.externalWalletBalance]
      })
      queryClient.invalidateQueries({
        queryKey: getWalletAudioBalanceQueryKey({
          address: params.walletAddress,
          chain: Chain.Sol
        })
      })
    }
  })
}
