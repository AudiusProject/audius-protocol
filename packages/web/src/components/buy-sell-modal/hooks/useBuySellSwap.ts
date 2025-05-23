import { useCallback, useContext, useEffect, useState } from 'react'

import { SLIPPAGE_BPS, useSwapTokens } from '@audius/common/api'
import { buySellMessages as messages } from '@audius/common/messages'
import { TOKEN_LISTING_MAP } from '@audius/common/src/store/ui/buy-audio/constants'

import { ToastContext } from 'components/toast/ToastContext'

import type { BuySellTab, Screen } from '../types'

import type { TransactionData } from './useBuySellTransactionData'

type UseBuySellSwapProps = {
  transactionData: TransactionData
  currentScreen: Screen
  setCurrentScreen: (screen: Screen) => void
  activeTab: BuySellTab
  onClose: () => void
}

export type SwapResult = {
  inputAmount: number
  outputAmount: number
}

export const useBuySellSwap = (props: UseBuySellSwapProps) => {
  const { transactionData, currentScreen, setCurrentScreen, activeTab } = props
  const { toast } = useContext(ToastContext)
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
      // Store the swap result when transaction is successful
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
      toast(swapError?.message || messages.transactionFailed, 5000)
    }
  }, [
    swapStatus,
    swapError,
    swapData,
    toast,
    setCurrentScreen,
    transactionData
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
    swapResult
  }
}
