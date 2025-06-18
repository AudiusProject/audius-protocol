import { useCallback, useEffect, useState } from 'react'

import { SLIPPAGE_BPS, useSwapTokens } from '../../../api'
import { TOKEN_LISTING_MAP } from '../buy-audio/constants'

import type { BuySellTab, Screen, SwapResult, TransactionData } from './types'

type UseBuySellSwapProps = {
  transactionData: TransactionData
  currentScreen: Screen
  setCurrentScreen: (screen: Screen) => void
  activeTab: BuySellTab
  onClose: () => void
}

export const useBuySellSwap = (props: UseBuySellSwapProps) => {
  const { transactionData, currentScreen, setCurrentScreen, activeTab } = props
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null)

  const {
    mutate: swapTokens,
    status: swapStatus,
    error: swapError,
    data: swapData
  } = useSwapTokens()

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

    const { inputAmount } = transactionData

    if (activeTab === 'buy') {
      swapTokens({
        inputMint: TOKEN_LISTING_MAP.USDC.address,
        outputMint: TOKEN_LISTING_MAP.AUDIO.address,
        amountUi: inputAmount,
        slippageBps: SLIPPAGE_BPS
      })
    } else {
      swapTokens({
        inputMint: TOKEN_LISTING_MAP.AUDIO.address,
        outputMint: TOKEN_LISTING_MAP.USDC.address,
        amountUi: inputAmount,
        slippageBps: SLIPPAGE_BPS
      })
    }
  }, [activeTab, transactionData, swapTokens, currentScreen])

  useEffect(() => {
    if (swapStatus === 'success' && swapData) {
      setSwapResult({
        inputAmount:
          swapData.inputAmount?.uiAmount ?? (transactionData?.inputAmount || 0),
        outputAmount:
          swapData.outputAmount?.uiAmount ??
          (transactionData?.outputAmount || 0)
      })
      setCurrentScreen('success')
    } else if (swapStatus === 'error') {
      setCurrentScreen('input')
    }
  }, [swapStatus, swapError, swapData, setCurrentScreen, transactionData])

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
    swapResult
  }
}
