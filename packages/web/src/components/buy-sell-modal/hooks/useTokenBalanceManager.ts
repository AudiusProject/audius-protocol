import { useMemo } from 'react'

import { useAudioBalance, useTokenBalance } from '@audius/common/api'
import { Status } from '@audius/common/models'
import { TokenInfo } from '@audius/common/store'
import { isNullOrUndefined } from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'

import type { BalanceConfig } from '../types'

export type TokenBalanceManager = {
  inputBalance: BalanceConfig
  outputBalance: BalanceConfig
}

/**
 * Shared hook for managing token balance fetching and formatting
 * Used by both ConvertTab and SellTab to eliminate code duplication
 */
export const useTokenBalanceManager = (
  inputToken: TokenInfo,
  outputToken: TokenInfo
): TokenBalanceManager => {
  // Fetch AUDIO balance for current user
  const { accountBalance } = useAudioBalance({ includeConnectedWallets: false })

  // Fetch balance for input token
  const { data: inputTokenBalanceData, status: inputTokenBalanceStatus } =
    useTokenBalance({
      mint: inputToken.address
    })

  // Fetch balance for output token
  const { data: outputTokenBalanceData, status: outputTokenBalanceStatus } =
    useTokenBalance({
      mint: outputToken.address
    })

  // Determine loading state for input token
  const isInputBalanceLoading = useMemo(() => {
    if (inputToken.symbol === 'AUDIO') {
      return isNullOrUndefined(accountBalance)
    } else {
      return inputTokenBalanceStatus === Status.LOADING
    }
  }, [inputToken.symbol, accountBalance, inputTokenBalanceStatus])

  // Determine loading state for output token
  const isOutputBalanceLoading = useMemo(() => {
    if (outputToken.symbol === 'AUDIO') {
      return isNullOrUndefined(accountBalance)
    } else {
      return outputTokenBalanceStatus === Status.LOADING
    }
  }, [outputToken.symbol, accountBalance, outputTokenBalanceStatus])

  // Get formatted balance for input token
  const getInputBalance = useMemo(() => {
    return () => {
      if (inputToken.symbol === 'AUDIO') {
        if (!isInputBalanceLoading && accountBalance) {
          return Number(AUDIO(accountBalance).toString())
        }
      } else {
        if (
          inputTokenBalanceStatus === Status.SUCCESS &&
          inputTokenBalanceData?.balance
        ) {
          return Number(inputTokenBalanceData.balance.toString())
        }
      }
      return undefined
    }
  }, [
    accountBalance,
    isInputBalanceLoading,
    inputToken.symbol,
    inputTokenBalanceData,
    inputTokenBalanceStatus
  ])

  // Get formatted balance for output token
  const getOutputBalance = useMemo(() => {
    return () => {
      if (outputToken.symbol === 'AUDIO') {
        if (!isOutputBalanceLoading && accountBalance) {
          return Number(AUDIO(accountBalance).toString())
        }
      } else {
        if (
          outputTokenBalanceStatus === Status.SUCCESS &&
          outputTokenBalanceData?.balance
        ) {
          return Number(outputTokenBalanceData.balance.toString())
        }
      }
      return undefined
    }
  }, [
    accountBalance,
    isOutputBalanceLoading,
    outputToken.symbol,
    outputTokenBalanceData,
    outputTokenBalanceStatus
  ])

  return {
    inputBalance: {
      get: getInputBalance,
      loading: isInputBalanceLoading,
      formatError: () => 'Insufficient balance'
    },
    outputBalance: {
      get: getOutputBalance,
      loading: isOutputBalanceLoading,
      formatError: () => 'Insufficient balance'
    }
  }
}
