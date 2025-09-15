import React, { useMemo, useRef } from 'react'

import {
  transformArtistCoinsToTokenInfoMap,
  useArtistCoins,
  useTokenPrice
} from '@audius/common/api'
import { buySellMessages } from '@audius/common/messages'
import type { TokenInfo, TokenPair } from '@audius/common/store'
import { useTokenSwapForm } from '@audius/common/store'
import { getCurrencyDecimalPlaces } from '@audius/common/utils'

import { Box, Flex, Skeleton, Text } from '@audius/harmony-native'
import { InputTokenSection } from 'app/components/buy-sell/InputTokenSection'
import { OutputTokenSection } from 'app/components/buy-sell/OutputTokenSection'

const YouPaySkeleton = () => (
  <Flex column gap='s'>
    <Flex row justifyContent='space-between' alignItems='flex-start'>
      <Box h='xl' w='unit24'>
        <Skeleton />
      </Box>
      <Box h='xl' w={160}>
        <Skeleton />
      </Box>
    </Flex>
    <Box h='4xl' w='100%'>
      <Skeleton />
    </Box>
  </Flex>
)

const YouReceiveSkeleton = () => (
  <Flex column gap='s'>
    <Box h='xl' w='5xl'>
      <Skeleton />
    </Box>
    <Box h='4xl' w='100%'>
      <Skeleton />
    </Box>
    <Box h='4xl' w='100%'>
      <Skeleton />
    </Box>
  </Flex>
)

const SwapFormSkeleton = () => (
  <Flex column gap='xl'>
    <YouPaySkeleton />
    <YouReceiveSkeleton />
  </Flex>
)

type BuyScreenProps = {
  tokenPair: TokenPair
  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
    error: string | null
    isInsufficientBalance: boolean
  }) => void
  error?: boolean
  errorMessage?: string
  initialInputValue?: string
  onInputValueChange?: (value: string) => void
}

export const BuyScreen = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange
}: BuyScreenProps) => {
  const { data: tokenPriceData, isPending: isTokenPriceLoading } =
    useTokenPrice(tokenPair ? tokenPair.baseToken.address : '')

  const tokenPrice = tokenPriceData?.price || null

  const decimalPlaces = useMemo(() => {
    if (!tokenPrice) return 2
    return getCurrencyDecimalPlaces(parseFloat(tokenPrice))
  }, [tokenPrice])

  const {
    inputAmount,
    outputAmount,
    isExchangeRateLoading,
    isBalanceLoading,
    availableBalance,
    currentExchangeRate,
    handleInputAmountChange,
    handleOutputAmountChange,
    handleMaxClick
  } = useTokenSwapForm({
    inputToken: tokenPair?.quoteToken,
    outputToken: tokenPair?.baseToken,
    onTransactionDataChange,
    initialInputValue,
    onInputValueChange
  })

  const { data: coins } = useArtistCoins()
  const availableOutputTokens: TokenInfo[] = useMemo(() => {
    return Object.values(transformArtistCoinsToTokenInfoMap(coins ?? []))
  }, [coins])

  // Track if an exchange rate has ever been successfully fetched
  const hasRateEverBeenFetched = useRef(false)
  if (currentExchangeRate !== null) {
    hasRateEverBeenFetched.current = true
  }

  if (!tokenPair) return null

  const { baseToken, quoteToken } = tokenPair

  // Show initial loading state if balance is loading,
  // OR if exchange rate is loading AND we've never fetched a rate before.
  const isInitialLoading =
    isBalanceLoading ||
    (isExchangeRateLoading && !hasRateEverBeenFetched.current)

  return (
    <Flex column gap='xl'>
      {isInitialLoading ? (
        <SwapFormSkeleton />
      ) : (
        <>
          <InputTokenSection
            title={buySellMessages.youPay}
            tokenInfo={quoteToken}
            amount={inputAmount}
            onAmountChange={handleInputAmountChange}
            onMaxClick={handleMaxClick}
            availableBalance={availableBalance}
            error={error}
            errorMessage={errorMessage}
          />
          <OutputTokenSection
            tokenInfo={baseToken}
            amount={outputAmount}
            onAmountChange={handleOutputAmountChange}
            availableBalance={0}
            exchangeRate={currentExchangeRate}
            tokenPrice={tokenPrice}
            isTokenPriceLoading={isTokenPriceLoading}
            tokenPriceDecimalPlaces={decimalPlaces}
            availableTokens={availableOutputTokens}
          />
        </>
      )}
      <Flex row gap='xs'>
        <Text color='subdued'>Rate</Text>
        <Text>{`1 ${quoteToken.symbol} ≈ ${(1 / tokenPrice).toFixed(8)} ${baseToken.symbol}`}</Text>
      </Flex>
    </Flex>
  )
}
