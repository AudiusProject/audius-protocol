import { useCallback, useEffect, useState, useRef } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { SLIPPAGE_BPS, useSwapTokens, useCurrentAccountUser } from '~/api'
import { SwapStatus } from '~/api/tan-query/jupiter/types'
import { QUERY_KEYS } from '~/api/tan-query/queryKeys'

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
  const queryClient = useQueryClient()
  const { data: user } = useCurrentAccountUser()
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSwapDataRef = useRef<any>(null)

  const MAX_RETRIES = 3
  const RETRY_DELAY = 2000

  const {
    mutate: swapTokens,
    status: swapStatus,
    error: swapError,
    data: swapData
  } = useSwapTokens()

  const performSwap = () => {
    if (!transactionData || !transactionData.isValid) return

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
  }

  const invalidateBalances = () => {
    if (user?.wallet) {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.usdcBalance, user.wallet]
      })
    }
    if (user?.spl_wallet) {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.audioBalance, user.spl_wallet]
      })
    }
  }

  const scheduleRetry = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    retryTimeoutRef.current = setTimeout(() => {
      invalidateBalances()
      performSwap()
    }, RETRY_DELAY)
  }

  const resetAndReturnToInput = useCallback(() => {
    setCurrentScreen('input')
    setRetryCount(0)
    setIsRetrying(false)
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
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

    setRetryCount(0)
    setIsRetrying(true)
    performSwap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionData, currentScreen])

  useEffect(() => {
    // Only process if we have new data (avoid processing the same result multiple times)
    if (swapData === lastSwapDataRef.current && swapStatus !== 'error') {
      return
    }
    lastSwapDataRef.current = swapData

    if (swapStatus === 'success' && swapData) {
      if (swapData.status === SwapStatus.SUCCESS) {
        // Success - navigate to success screen
        setSwapResult({
          inputAmount:
            swapData.inputAmount?.uiAmount ??
            (transactionData?.inputAmount || 0),
          outputAmount:
            swapData.outputAmount?.uiAmount ??
            (transactionData?.outputAmount || 0)
        })
        setCurrentScreen('success')
        setRetryCount(0)
        setIsRetrying(false)
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }
      } else if (isRetrying) {
        // Swap failed, handle retry
        if (retryCount < MAX_RETRIES) {
          setRetryCount((prev) => prev + 1)
          scheduleRetry()
        } else {
          resetAndReturnToInput()
        }
      }
    } else if (swapStatus === 'error' && isRetrying) {
      // Network/API error, handle retry
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1)
        scheduleRetry()
      } else {
        resetAndReturnToInput()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    swapStatus,
    swapData,
    setCurrentScreen,
    transactionData,
    retryCount,
    isRetrying,
    resetAndReturnToInput
  ])

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  const isContinueButtonLoading =
    swapStatus === 'pending' && currentScreen === 'input'
  const isConfirmButtonLoading =
    (swapStatus === 'pending' || isRetrying) && currentScreen === 'confirm'

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
