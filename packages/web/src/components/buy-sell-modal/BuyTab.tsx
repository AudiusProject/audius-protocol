import { useMemo } from 'react'

import { useTokenExchangeRate } from '@audius/common/src/api/tan-query/useTokenExchangeRate'
import { useUSDCBalance } from '@audius/common/src/hooks/useUSDCBalance'
import { Status } from '@audius/common/src/models/Status'
import { Flex, Text } from '@audius/harmony'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { TokenAmountSection } from './TokenAmountSection'
import { useTokenSwapForm } from './hooks/useTokenSwapForm'
import { TokenPair } from './types'

type BuyTabProps = {
  tokenPair: TokenPair
  onTransactionDataChange?: (data: {
    inputAmount: number
    outputAmount: number
    isValid: boolean
  }) => void
}

// Min and max amounts in USDC
const MIN_AMOUNT = 1 // $1 minimum
const MAX_AMOUNT = 5000 // $5000 maximum

export const BuyTab = ({ tokenPair, onTransactionDataChange }: BuyTabProps) => {
  const { baseToken, quoteToken } = tokenPair

  // Fetch real USDC balance
  const { status: balanceStatus, data: usdcBalance } = useUSDCBalance({
    isPolling: false
  })

  // Get USDC balance in UI format
  const getUsdcBalance = useMemo(() => {
    return () => {
      if (balanceStatus === Status.SUCCESS && usdcBalance) {
        return parseFloat(usdcBalance.toString()) / 10 ** quoteToken.decimals
      }
      return undefined
    }
  }, [balanceStatus, usdcBalance, quoteToken.decimals])

  // Use the shared hook for form logic
  const {
    numericInputAmount,
    outputAmount,
    error,
    exchangeRateError,
    isExchangeRateLoading,
    isBalanceLoading: ignoredIsBalanceLoading, // We use our own balance loading indicator
    availableBalance,
    currentExchangeRate,
    handleInputAmountChange,
    handleMaxClick
  } = useTokenSwapForm({
    inputToken: quoteToken,
    outputToken: baseToken,
    inputTokenSymbol: 'USDC',
    outputTokenSymbol: 'AUDIO',
    minAmount: MIN_AMOUNT,
    maxAmount: MAX_AMOUNT,
    getInputBalance: getUsdcBalance,
    isBalanceLoading: balanceStatus === Status.LOADING,
    formatBalanceError: () => 'Insufficient balance',
    getExchangeRate: useTokenExchangeRate,
    defaultExchangeRate: tokenPair.exchangeRate,
    onTransactionDataChange
  })

  return (
    <Flex direction='column' gap='l'>
      {/* Show loading state while fetching balance */}
      {balanceStatus === Status.LOADING && !usdcBalance && (
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
        tokenInfo={quoteToken}
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
        tokenInfo={baseToken}
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
