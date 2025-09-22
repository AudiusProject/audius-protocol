import { useCallback, useEffect, useRef, useState } from 'react'

import { HashId } from '@audius/sdk'
import { useQueryClient } from '@tanstack/react-query'

import {
  SLIPPAGE_BPS,
  useArtistCoin,
  useCurrentAccountUser,
  useSwapTokens,
  useUser,
  useUserTracksByHandle
} from '~/api'
import { SwapStatus } from '~/api/tan-query/jupiter/types'
import { QUERY_KEYS } from '~/api/tan-query/queryKeys'
import { isContentTokenGated } from '~/models'

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
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSwapDataRef = useRef<any>(null)

  const { data: baseCoin } = useArtistCoin(selectedPair.baseToken.address ?? '')
  const { data: quoteCoin } = useArtistCoin(
    selectedPair.quoteToken.address ?? ''
  )
  const baseOwnerId = baseCoin?.ownerId ? HashId.parse(baseCoin?.ownerId) : null
  const quoteOwnerId = quoteCoin?.ownerId
    ? HashId.parse(quoteCoin?.ownerId)
    : null

  const { data: baseUser } = useUser(baseOwnerId)
  const { data: quoteUser } = useUser(quoteOwnerId)

  const { data: baseUserTracks } = useUserTracksByHandle({
    handle: baseUser?.handle
  })
  const { data: quoteUserTracks } = useUserTracksByHandle({
    handle: quoteUser?.handle
  })

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
      // Invalidate artist coin members queries (leaderboard)
      if (baseCoin?.mint) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.artistCoinMembers, baseCoin?.mint]
        })
      }
      if (quoteCoin?.mint) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.artistCoinMembers, quoteCoin?.mint]
        })
      }

      // Invalidate track queries to provide track access if the user has traded the artist coin
      if (baseUserTracks?.length) {
        baseUserTracks.forEach((track) => {
          if (isContentTokenGated(track.stream_conditions)) {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.track, track.track_id]
            })
          }
        })
      }
      if (quoteUserTracks?.length) {
        quoteUserTracks.forEach((track) => {
          if (isContentTokenGated(track.stream_conditions)) {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.track, track.track_id]
            })
          }
        })
      }
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

    // @ts-ignore - weird mobile type issue
    retryTimeoutRef.current = setTimeout(() => {
      invalidateBalances()
      performSwap()
    }, RETRY_DELAY) as unknown as NodeJS.Timeout
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
      } else {
        // Swap failed but not retrying - return to input screen (fallback)
        resetAndReturnToInput()
      }
    } else if (swapStatus === 'error') {
      if (isRetrying) {
        // Network/API error, handle retry
        if (retryCount < MAX_RETRIES) {
          setRetryCount((prev) => prev + 1)
          scheduleRetry()
        } else {
          resetAndReturnToInput()
        }
      } else {
        // Network/API error but not retrying - return to input screen (fallback)
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
    swapResult,
    swapData,
    isRetrying,
    retryCount
  }
}
