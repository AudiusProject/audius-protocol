import React, { useRef } from 'react'

import type { TokenInfo } from '@audius/common/store'
import { useTokenSwapForm } from '@audius/common/store'

import { Divider, Flex, Skeleton } from '@audius/harmony-native'

import { TokenAmountSection } from '../../../components/buy-sell'

const messages = {
  youPay: 'You Pay',
  youReceive: 'You Receive',
  placeholder: '0.00'
}

const YouPaySkeleton = () => (
  <Flex direction='column' gap='l'>
    <Flex
      direction='row'
      justifyContent='space-between'
      alignItems='flex-start'
    >
      <Skeleton h='l' w='unit15' />
      <Flex direction='column' gap='xs' alignItems='flex-end'>
        <Skeleton h='l' w='unit24' />
        <Skeleton h='xl' w='unit15' />
      </Flex>
    </Flex>
    <Skeleton h='unit21' w='100%' />
  </Flex>
)

const YouReceiveSkeleton = () => (
  <Flex direction='column' gap='l' mb='5xl'>
    <Skeleton h='l' w='unit23' />
    <Skeleton h='unit21' w='100%' />
  </Flex>
)

const SwapFormSkeleton = () => (
  <Flex direction='column' gap='3xl'>
    <YouPaySkeleton />
    <Divider />
    <YouReceiveSkeleton />
  </Flex>
)

export type SwapTabProps = {
  inputToken: TokenInfo
  outputToken: TokenInfo
  min?: number
  max?: number
  balance: number
  outputBalance?: number

  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
    error: string | null
    isInsufficientBalance: boolean
  }) => void
  isDefault?: boolean
  error?: boolean
  errorMessage?: string
  tokenPrice?: string | null
  isTokenPriceLoading?: boolean
  tokenPriceDecimalPlaces?: number
  initialInputValue?: string
  onInputValueChange?: (value: string) => void
}

export const SwapTab = ({
  inputToken,
  outputToken,
  min,
  max,
  onTransactionDataChange,
  isDefault = true,
  error,
  errorMessage,
  tokenPrice,
  isTokenPriceLoading,
  tokenPriceDecimalPlaces = 2,
  initialInputValue,
  onInputValueChange
}: SwapTabProps) => {
  const {
    inputAmount,
    outputAmount,
    isExchangeRateLoading,
    isBalanceLoading,
    availableBalance,
    currentExchangeRate,
    handleInputAmountChange,
    handleMaxClick
  } = useTokenSwapForm({
    inputToken,
    outputToken,
    min,
    max,
    onTransactionDataChange,
    initialInputValue,
    onInputValueChange
  })

  // Track if an exchange rate has ever been successfully fetched
  const hasRateEverBeenFetched = useRef(false)
  if (currentExchangeRate !== null) {
    hasRateEverBeenFetched.current = true
  }

  // Show initial loading state if balance is loading,
  // OR if exchange rate is loading AND we've never fetched a rate before.
  const isInitialLoading =
    isBalanceLoading ||
    (isExchangeRateLoading && !hasRateEverBeenFetched.current)

  return (
    <Flex direction='column' gap='l'>
      {isInitialLoading ? (
        <SwapFormSkeleton />
      ) : (
        <>
          <TokenAmountSection
            title={messages.youPay}
            tokenInfo={inputToken}
            isInput={true}
            amount={inputAmount}
            onAmountChange={handleInputAmountChange}
            onMaxClick={handleMaxClick}
            availableBalance={availableBalance}
            placeholder={messages.placeholder}
            isDefault={isDefault}
            error={error}
            errorMessage={errorMessage}
          />
          <Divider flex={1} />
          <TokenAmountSection
            title={messages.youReceive}
            tokenInfo={outputToken}
            isInput={false}
            amount={outputAmount}
            availableBalance={0}
            exchangeRate={currentExchangeRate}
            tokenPrice={tokenPrice}
            isTokenPriceLoading={isTokenPriceLoading}
            tokenPriceDecimalPlaces={tokenPriceDecimalPlaces}
          />
        </>
      )}
    </Flex>
  )
}
