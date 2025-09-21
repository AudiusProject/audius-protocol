/**
 * Combined hook for managing token balance and exchange rate data
 * Consolidates data fetching and provides clean interface to consumers
 * Supports fetching balance for any specified token mint address
 */

import { useMemo } from 'react'

import { useTokenBalance, useTokenExchangeRate } from '~/api'
import { useExternalWalletBalance } from '~/api/tan-query/wallets/useExternalWalletBalance'

import type { TokenInfo, TokenDataHookResult } from '../types/swap.types'
import {
  deriveDisplayExchangeRate,
  getSafeAmountForExchangeRate
} from '../utils/tokenCalculations'

export type UseTokenDataProps = {
  inputToken: TokenInfo
  outputToken: TokenInfo
  inputAmount: number
  externalWalletAddress?: string
  /** The mint address of the token to fetch balance for. If not provided, defaults to inputToken.address */
  mint?: string
}

/**
 * Hook that consolidates token balance and exchange rate fetching
 * Provides a clean interface with loading states and error handling
 *
 * @param inputToken - Token information for the input side of the swap
 * @param outputToken - Token information for the output side of the swap
 * @param inputAmount - Amount for exchange rate calculations
 * @param externalWalletAddress - Optional external wallet address for balance fetching
 * @param mint - Optional mint address for balance fetching. If not provided, defaults to inputToken.address
 */
export const useTokenData = ({
  inputToken,
  outputToken,
  inputAmount,
  externalWalletAddress,
  mint
}: UseTokenDataProps): TokenDataHookResult => {
  // Determine which mint to use for balance fetching
  const balanceMint = mint ?? inputToken.address

  // Get token balance
  const {
    data: internalWalletBalanceData,
    isPending: isInternalWalletBalanceLoading
  } = useTokenBalance({
    mint: balanceMint,
    includeExternalWallets: false
  })

  const {
    data: externalWalletBalanceData,
    isPending: isExternalWalletBalanceLoading
  } = useExternalWalletBalance({
    walletAddress: externalWalletAddress,
    mint: balanceMint
  })

  const balanceData = externalWalletAddress
    ? externalWalletBalanceData
    : internalWalletBalanceData
  const isBalanceLoading = externalWalletAddress
    ? isExternalWalletBalanceLoading
    : isInternalWalletBalanceLoading

  // Get token price for calculations (currently unused but may be needed for future features)
  // const { data: tokenPriceData } = useArtistCoin({ mint: inputToken.address })

  // Calculate safe amount for exchange rate API
  const safeExchangeRateAmount = useMemo(() => {
    return getSafeAmountForExchangeRate(inputAmount)
  }, [inputAmount])

  // Get exchange rate data
  const {
    data: exchangeRateData,
    isLoading: isExchangeRateLoading,
    error: exchangeRateError,
    refetch: refetchExchangeRate
  } = useTokenExchangeRate({
    inputMint: inputToken.address,
    outputMint: outputToken.address,
    inputDecimals: inputToken.decimals,
    outputDecimals: outputToken.decimals,
    inputAmount: safeExchangeRateAmount > 0 ? safeExchangeRateAmount : 1
  })

  // Process balance data
  const balance = useMemo(() => {
    return Number(balanceData?.balance ?? 0)
  }, [balanceData?.balance])

  const formattedBalance = useMemo(() => {
    if (!balanceData?.balance) return '0'
    return balanceData.balance.toString()
  }, [balanceData?.balance])

  // Process exchange rate data
  const exchangeRate = useMemo(() => {
    return exchangeRateData?.rate ?? null
  }, [exchangeRateData?.rate])

  const displayExchangeRate = useMemo(() => {
    return deriveDisplayExchangeRate(exchangeRateData || null)
  }, [exchangeRateData])

  return {
    // Balance data
    balance,
    formattedBalance,

    // Exchange rate data
    exchangeRate,
    displayExchangeRate,

    // Loading states
    isBalanceLoading,
    isExchangeRateLoading,

    // Error states
    balanceError: null, // Simplified for now
    exchangeRateError,

    // Refetch functions
    refetchBalance: () => {}, // Simplified for now
    refetchExchangeRate
  }
}
