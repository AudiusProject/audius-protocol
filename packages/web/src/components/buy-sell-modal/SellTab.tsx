import { useMemo } from 'react'

import { useTokenExchangeRate } from '@audius/common/src/api/tan-query/useTokenExchangeRate'
import { useTotalBalanceWithFallback } from '@audius/common/src/hooks/useAudioBalance'
import { isNullOrUndefined } from '@audius/common/src/utils'
import { AUDIO } from '@audius/fixed-decimal'
import { Flex, Text } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { TokenAmountSection } from './TokenAmountSection'
import { useTokenSwapForm } from './hooks/useTokenSwapForm'
import { TokenPair } from './types'

type SellTabProps = {
  tokenPair: TokenPair
  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
  }) => void
}

// Min and max amounts in AUDIO
const MIN_AMOUNT = 5 // 5 AUDIO minimum
const MAX_AMOUNT = 2500 // 2500 AUDIO maximum

export const SellTab = ({
  tokenPair,
  onTransactionDataChange
}: SellTabProps) => {
  const { baseToken, quoteToken } = tokenPair

  // Fetch real AUDIO balance using Redux (more reliable than tan-query in this context)
  const totalBalance = useTotalBalanceWithFallback()
  const isBalanceLoading = isNullOrUndefined(totalBalance)

  // Get AUDIO balance in UI format
  const getAudioBalance = useMemo(() => {
    return () => {
      if (!isBalanceLoading && totalBalance) {
        return parseFloat(AUDIO(totalBalance).toString())
      }
      return undefined
    }
  }, [totalBalance, isBalanceLoading])

  // Use the shared hook for form logic
  const {
    numericInputAmount,
    outputAmount,
    error,
    exchangeRateError,
    isExchangeRateLoading,
    availableBalance,
    currentExchangeRate,
    handleInputAmountChange,
    handleMaxClick
  } = useTokenSwapForm({
    inputToken: baseToken,
    outputToken: quoteToken,
    inputTokenSymbol: 'AUDIO',
    outputTokenSymbol: 'USDC',
    minAmount: MIN_AMOUNT,
    maxAmount: MAX_AMOUNT,
    getInputBalance: getAudioBalance,
    isBalanceLoading,
    formatBalanceError: () => 'Insufficient balance',
    getExchangeRate: useTokenExchangeRate,
    defaultExchangeRate: tokenPair.exchangeRate,
    onTransactionDataChange
  })

  return (
    <Flex direction='column' gap='l'>
      {/* Show loading state while fetching balance */}
      {isBalanceLoading && (
        <Flex justifyContent='center' css={{ padding: '8px' }}>
          <LoadingSpinner />
        </Flex>
      )}

      {/* Show error from exchange rate fetch */}
      {exchangeRateError && (
        <Flex
          direction='column'
          css={{
            padding: '16px',
            backgroundColor: 'var(--harmony-error-100)',
            borderRadius: '4px',
            color: 'var(--harmony-error-600)'
          }}
        >
          <Text>Unable to fetch exchange rate. Please try again.</Text>
        </Flex>
      )}

      {/* Input amount section */}
      <TokenAmountSection
        title='You Pay'
        tokenInfo={baseToken}
        isInput={true}
        amount={numericInputAmount}
        onAmountChange={handleInputAmountChange}
        onMaxClick={handleMaxClick}
        availableBalance={availableBalance}
        placeholder='0.00'
      />

      {/* Show validation error */}
      {error && (
        <Flex
          direction='column'
          css={{
            marginTop: '-12px',
            padding: '12px',
            backgroundColor: 'var(--harmony-error-100)',
            borderRadius: '4px',
            color: 'var(--harmony-error-600)'
          }}
        >
          <Text>{error}</Text>
        </Flex>
      )}

      {/* Output amount section */}
      <TokenAmountSection
        title='You Receive'
        tokenInfo={quoteToken}
        isInput={false}
        amount={outputAmount}
        availableBalance={0}
        exchangeRate={currentExchangeRate}
      />

      {/* Loading indicator for exchange rate */}
      {isExchangeRateLoading && numericInputAmount > 0 && (
        <Flex justifyContent='center' css={{ padding: '8px' }}>
          <LoadingSpinner css={{ width: '24px', height: '24px' }} />
        </Flex>
      )}
    </Flex>
  )
}
