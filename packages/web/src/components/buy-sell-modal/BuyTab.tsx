import { useEffect, useMemo, useRef, useState } from 'react'

import {
  transformArtistCoinsToTokenInfoMap,
  useArtistCoins,
  useTokenPrice
} from '@audius/common/api'
import { buySellMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import type { TokenInfo } from '@audius/common/store'
import { useTokenSwapForm } from '@audius/common/store'
import { getCurrencyDecimalPlaces } from '@audius/common/utils'
import { Flex, Skeleton, Text } from '@audius/harmony'

import { useFlag } from 'hooks/useRemoteConfig'

import { InputTokenSection } from './components/InputTokenSection'
import { OutputTokenSection } from './components/OutputTokenSection'
import type { BuyTabProps } from './types'

const YouPaySkeleton = () => (
  <Flex direction='column' gap='s'>
    <Flex justifyContent='space-between' alignItems='flex-start'>
      <Skeleton w='100px' h='24px' />
      <Skeleton w='160px' h='24px' />
    </Flex>
    <Skeleton w='100%' h='64px' />
  </Flex>
)

const YouReceiveSkeleton = () => (
  <Flex direction='column' gap='s'>
    <Skeleton w='120px' h='24px' />
    <Skeleton w='100%' h='64px' />
    <Skeleton w='100%' h='64px' />
  </Flex>
)

const SwapFormSkeleton = () => (
  <Flex direction='column' gap='xl'>
    <YouPaySkeleton />
    <YouReceiveSkeleton />
  </Flex>
)

export const BuyTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange,
  availableOutputTokens,
  onOutputTokenChange
}: BuyTabProps) => {
  const { baseToken, quoteToken } = tokenPair
  const { isEnabled: isArtistCoinsEnabled } = useFlag(FeatureFlags.ARTIST_COINS)

  // State for token selection
  const [selectedOutputToken, setSelectedOutputToken] = useState(baseToken)

  useEffect(() => {
    setSelectedOutputToken(baseToken)
  }, [baseToken])

  const { data: tokenPriceData, isPending: isTokenPriceLoading } =
    useTokenPrice(selectedOutputToken.address)

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
    inputToken: quoteToken,
    outputToken: selectedOutputToken,
    onTransactionDataChange,
    initialInputValue,
    onInputValueChange
  })

  const { data: coins } = useArtistCoins()
  const artistCoins: TokenInfo[] = useMemo(() => {
    return Object.values(transformArtistCoinsToTokenInfoMap(coins ?? []))
  }, [coins])

  // Token change handlers
  const handleOutputTokenChange = (token: TokenInfo) => {
    setSelectedOutputToken(token)
    onOutputTokenChange?.(token.symbol)
  }

  // Track if an exchange rate has ever been successfully fetched
  const hasRateEverBeenFetched = useRef(false)
  if (currentExchangeRate !== null) {
    hasRateEverBeenFetched.current = true
  }

  if (!tokenPair) return null

  // Show initial loading state if balance is loading,
  // OR if exchange rate is loading AND we've never fetched a rate before.
  const isInitialLoading =
    isBalanceLoading ||
    (isExchangeRateLoading && !hasRateEverBeenFetched.current)

  return (
    <Flex direction='column' gap='xl'>
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
            tokenInfo={selectedOutputToken}
            amount={outputAmount}
            onAmountChange={handleOutputAmountChange}
            availableBalance={0}
            exchangeRate={currentExchangeRate}
            tokenPrice={tokenPrice}
            isTokenPriceLoading={isTokenPriceLoading}
            tokenPriceDecimalPlaces={decimalPlaces}
            availableTokens={artistCoins}
            onTokenChange={handleOutputTokenChange}
            isArtistCoinsEnabled={isArtistCoinsEnabled}
          />
        </>
      )}

      {tokenPrice && (
        <Flex alignItems='center' gap='xs'>
          <Text variant='body' size='s' color='subdued'>
            {buySellMessages.exchangeRateLabel}
          </Text>
          <Text variant='body' size='s' color='default'>
            {buySellMessages.exchangeRateValue(
              quoteToken.symbol,
              selectedOutputToken.symbol,
              currentExchangeRate
            )}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
