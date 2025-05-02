import { Flex, Text, Skeleton } from '@audius/harmony'

import { TokenAmountSection } from './TokenAmountSection'
import { useTokenSwapForm } from './hooks/useTokenSwapForm'
import { TokenInfo } from './types'

const TokenSectionSkeleton = ({ title }: { title: string }) => (
  <Flex direction='column' gap='s'>
    <Skeleton h='xl' w={title === 'input' ? 'unit20' : 'unit24'} />
    <Skeleton h='unit14' w='100%' />
  </Flex>
)

const ExchangeRateSkeleton = () => (
  <Flex justifyContent='center' p='s'>
    <Skeleton w='unit30' h='xl' />
  </Flex>
)

const SwapFormSkeleton = () => (
  <Flex direction='column' gap='l'>
    <TokenSectionSkeleton title='input' />
    <TokenSectionSkeleton title='output' />
  </Flex>
)

export type SwapTabProps = {
  inputToken: TokenInfo
  outputToken: TokenInfo
  min?: number
  max?: number
  balance: {
    get: () => number | undefined
    loading: boolean
    formatError: () => string
  }

  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
  }) => void
}

export const SwapTab = ({
  inputToken,
  outputToken,
  min,
  max,
  balance,
  onTransactionDataChange
}: SwapTabProps) => {
  // Use the shared hook for form logic
  const {
    numericInputAmount,
    outputAmount,
    error,
    exchangeRateError,
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
    balance,

    onTransactionDataChange
  })

  // Show initial loading state if we don't have a balance or exchange rate yet
  const isInitialLoading =
    isBalanceLoading || (isExchangeRateLoading && !currentExchangeRate)

  return (
    <Flex direction='column' gap='l'>
      {/* Show loading state while fetching balance or initial exchange rate */}
      {isInitialLoading && <SwapFormSkeleton />}

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
        tokenInfo={inputToken}
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
        tokenInfo={outputToken}
        isInput={false}
        amount={outputAmount}
        availableBalance={0}
        exchangeRate={currentExchangeRate}
      />

      {/* Loading indicator for exchange rate */}
      {isExchangeRateLoading && numericInputAmount > 0 && !isInitialLoading && (
        <ExchangeRateSkeleton />
      )}
    </Flex>
  )
}
