import { useCallback, useEffect, useRef, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { SLIPPAGE_BPS, useCurrentAccountUser, useSwapTokens } from '~/api'
import { SwapStatus } from '~/api/tan-query/jupiter/types'
import { QUERY_KEYS } from '~/api/tan-query/queryKeys'

import type {
  BuySellTab,
  Screen,
  SwapResult,
  TokenPair,
  TransactionData
} from './types'

type UseBuySellSwapProps = {
  transactionData: TransactionData
  currentScreen: Screen
  setCurrentScreen: (screen: Screen) => void
  activeTab: BuySellTab
  selectedPair: TokenPair
  onClose: () => void
}

export const useBuySellSwap = (props: UseBuySellSwapProps) => {
  const {
    transactionData,
    currentScreen,
    setCurrentScreen,
    activeTab,
    selectedPair
  } = props
  const queryClient = useQueryClient()
  const { data: user } = useCurrentAccountUser()
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null)
  const lastSwapDataRef = useRef<any>(null)

  const {
    mutate: swapTokens,
    status: swapStatus,
    error: swapError,
    data: swapData
  } = useSwapTokens()

  const performSwap = () => {
    if (!transactionData || !transactionData.isValid) return

    const { inputAmount } = transactionData

    // Get the correct input and output token addresses based on the selected pair and active tab
    let inputMintAddress: string
    let outputMintAddress: string

    if (activeTab === 'buy') {
      // Buy: pay with quote token, receive base token
      inputMintAddress = selectedPair.quoteToken.address ?? ''
      outputMintAddress = selectedPair.baseToken.address ?? ''
    } else {
      // Sell: pay with base token, receive quote token
      inputMintAddress = selectedPair.baseToken.address ?? ''
      outputMintAddress = selectedPair.quoteToken.address ?? ''
    }

    swapTokens({
      inputMint: inputMintAddress,
      outputMint: outputMintAddress,
      amountUi: inputAmount,
      slippageBps: SLIPPAGE_BPS
    })
  }

  const invalidateBalances = () => {
    if (user?.wallet) {
      // Invalidate USDC balance queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.usdcBalance, user.wallet]
      })
      // Invalidate individual user coin queries (for artist coins and $AUDIO)
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.userCoin]
      })
      // Invalidate general user coins queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.userCoins]
      })
    }
    if (user?.spl_wallet) {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.audioBalance, user.spl_wallet]
      })
    }
  }

  const resetAndReturnToInput = useCallback(() => {
    setCurrentScreen('input')
  }, [setCurrentScreen])

  const handleShowConfirmation = useCallback(() => {
    if (
      !transactionData ||
      !transactionData.isValid ||
      currentScreen !== 'input'
    )
      return
    setCurrentScreen('confirm')
  }, [transactionData, currentScreen, setCurrentScreen])

  const handleConfirmSwap = useCallback(() => {
    if (
      !transactionData ||
      !transactionData.isValid ||
      currentScreen !== 'confirm'
    )
      return

    performSwap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionData, currentScreen, activeTab])

  useEffect(() => {
    // Only process if we have new data (avoid processing the same result multiple times)
    if (swapData === lastSwapDataRef.current) {
      return
    }
    lastSwapDataRef.current = swapData

    if (swapStatus === 'success' && swapData) {
      if (swapData.status === SwapStatus.SUCCESS) {
        // Success - invalidate balances and navigate to success screen
        invalidateBalances()
        setSwapResult({
          inputAmount:
            swapData.inputAmount?.uiAmount ??
            (transactionData?.inputAmount || 0),
          outputAmount:
            swapData.outputAmount?.uiAmount ??
            (transactionData?.outputAmount || 0),
          signature: swapData.signature
        })
        setCurrentScreen('success')
      } else {
        // Swap failed - return to input screen
        resetAndReturnToInput()
      }
    } else if (swapStatus === 'error') {
      // Network/API error - return to input screen
      resetAndReturnToInput()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    swapStatus,
    swapData,
    setCurrentScreen,
    transactionData,
    resetAndReturnToInput
  ])

  const isContinueButtonLoading =
    swapStatus === 'pending' && currentScreen === 'input'
  const isConfirmButtonLoading =
    swapStatus === 'pending' && currentScreen === 'confirm'

  return {
    handleShowConfirmation,
    handleConfirmSwap,
    isContinueButtonLoading,
    isConfirmButtonLoading,
    swapError,
    swapStatus,
    swapResult,
    swapData
  }
}
