import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import { Flex } from '@audius/harmony'

import { useFlag } from 'hooks/useRemoteConfig'

import { InputTokenSection } from './components/InputTokenSection'
import { OutputTokenSection } from './components/OutputTokenSection'
import { SwapFormSkeleton } from './components/SwapSkeletons'
import { ConvertTabProps } from './types'

export const ConvertTab = ({
  tokenPair,
  onTransactionDataChange,
  error,
  errorMessage,
  initialInputValue,
  onInputValueChange,
  availableInputTokens,
  availableOutputTokens,
  onInputTokenChange,
  onOutputTokenChange,
  onChangeSwapDirection
}: ConvertTabProps) => {
  const { baseToken, quoteToken } = tokenPair
  const { isEnabled: isArtistCoinsEnabled } = useFlag(FeatureFlags.ARTIST_COINS)

  // State for token selection
  const [selectedInputToken, setSelectedInputToken] = useState(baseToken)
  const [selectedOutputToken, setSelectedOutputToken] = useState(quoteToken)

  useEffect(() => {
    setSelectedInputToken(baseToken)
    setSelectedOutputToken(quoteToken)
  }, [baseToken, quoteToken])

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
    inputToken: selectedInputToken,
    outputToken: selectedOutputToken,
    onTransactionDataChange,
    initialInputValue,
    onInputValueChange
  })

  const { data: coins } = useArtistCoins()
  const artistCoins: TokenInfo[] = useMemo(() => {
    return Object.values(transformArtistCoinsToTokenInfoMap(coins ?? []))
  }, [coins])

  const totalAvailableTokens = useMemo(() => {
    const allTokens = [
      ...(availableInputTokens ?? []),
      ...(availableOutputTokens ?? []),
      ...artistCoins
    ]
    return allTokens.filter(
      (token, index, arr) =>
        arr.findIndex((t) => t.symbol === token.symbol) === index
    ) // Remove duplicates
  }, [availableInputTokens, availableOutputTokens, artistCoins])

  // Generic token change handler with automatic swapping when only 2 tokens are available
  const createTokenChangeHandler = useCallback(
    (
      primaryCallback: (token: TokenInfo) => void,
      secondaryCallback?: (token: TokenInfo) => void
    ) =>
      (token: TokenInfo) => {
        primaryCallback(token)

        // If there are only 2 total available tokens, automatically set the other token
        if (totalAvailableTokens.length === 2) {
          const otherToken = totalAvailableTokens.find(
            (t) => t.symbol !== token.symbol
          )
          if (otherToken && secondaryCallback) {
            secondaryCallback(otherToken)
          }
        }
      },
    [totalAvailableTokens]
  )

  const handleInputTokenChange = useMemo(
    () =>
      createTokenChangeHandler(
        (token) => {
          setSelectedInputToken(token)
          onInputTokenChange?.(token.symbol)
        },
        (token) => {
          setSelectedOutputToken(token)
          onOutputTokenChange?.(token.symbol)
        }
      ),
    [createTokenChangeHandler, onInputTokenChange, onOutputTokenChange]
  )

  const handleOutputTokenChange = useMemo(
    () =>
      createTokenChangeHandler(
        (token) => {
          setSelectedOutputToken(token)
          onOutputTokenChange?.(token.symbol)
        },
        (token) => {
          setSelectedInputToken(token)
          onInputTokenChange?.(token.symbol)
        }
      ),
    [createTokenChangeHandler, onInputTokenChange, onOutputTokenChange]
  )

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
            tokenInfo={selectedInputToken}
            amount={inputAmount}
            onAmountChange={handleInputAmountChange}
            onMaxClick={handleMaxClick}
            availableBalance={availableBalance}
            error={error}
            errorMessage={errorMessage}
            availableTokens={totalAvailableTokens}
            onTokenChange={handleInputTokenChange}
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
            availableTokens={totalAvailableTokens}
            onTokenChange={handleOutputTokenChange}
            isArtistCoinsEnabled={isArtistCoinsEnabled}
          />
        </>
      )}
    </Flex>
  )
}
