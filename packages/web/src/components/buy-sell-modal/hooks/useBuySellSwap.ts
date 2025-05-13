import { useCallback, useContext, useEffect } from 'react'

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

export const useBuySellSwap = (props: UseBuySellSwapProps) => {
  const {
    transactionData,
    currentScreen,
    setCurrentScreen,
    activeTab,
    onClose
  } = props
  const { toast } = useContext(ToastContext)

  const {
    mutate: swapTokens,
    status: swapStatus,
    error: swapError
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
    if (swapStatus === 'success') {
      toast(
        activeTab === 'buy' ? messages.buySuccess : messages.sellSuccess,
        3000
      )
      const timer = setTimeout(() => {
        setCurrentScreen('input')
        onClose()
      }, 1000)
      return () => clearTimeout(timer)
    } else if (swapStatus === 'error') {
      toast(swapError?.message || messages.transactionFailed, 5000)
    }
  }, [swapStatus, swapError, activeTab, onClose, toast, setCurrentScreen])

  const isContinueButtonLoading =
    swapStatus === 'pending' && currentScreen === 'input'
  const isConfirmButtonLoading =
    swapStatus === 'pending' && currentScreen === 'confirm'

  return {
    handleShowConfirmation,
    handleConfirmSwap,
    isContinueButtonLoading,
    isConfirmButtonLoading,
    swapError
  }
}
