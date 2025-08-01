import { useRef } from 'react'

import { buySellMessages } from '@audius/common/messages'
import { TokenInfo, useTokenSwapForm } from '@audius/common/store'
import { Flex, Skeleton, Text } from '@audius/harmony'
import { Form, FormikProvider } from 'formik'

import { TokenAmountSection } from './TokenAmountSection'
import type {
  BalanceConfig,
  TokenPricing,
  UIConfiguration,
  InputConfiguration,
  TokenSelection,
  SwapCallbacks
} from './types'

const messages = {
  ...buySellMessages,
  placeholder: '0.00'
}

const TokenSectionSkeleton = ({ title }: { title: string }) => (
  <Flex direction='column' gap='s'>
    <Skeleton h='xl' w={title === 'input' ? 'unit20' : 'unit24'} />
    <Skeleton h='unit14' w='100%' />
  </Flex>
)

const SwapFormSkeleton = () => (
  <Flex direction='column'>
    <TokenSectionSkeleton title='input' />
    <TokenSectionSkeleton title='output' />
  </Flex>
)

export type SwapTabProps = {
  inputToken: TokenInfo
  outputToken: TokenInfo
  balance: BalanceConfig
  outputBalance?: BalanceConfig
  inputIsDefault?: boolean
  outputIsDefault?: boolean
} & TokenPricing &
  UIConfiguration &
  InputConfiguration &
  TokenSelection &
  SwapCallbacks

export const SwapTab = ({
  inputToken,
  outputToken,
  min,
  max,
  balance,
  outputBalance,
  onTransactionDataChange,
  isDefault = true,
  inputIsDefault,
  outputIsDefault,
  error,
  errorMessage,
  tokenPrice,
  isTokenPriceLoading,
  tokenPriceDecimalPlaces = 2,
  tooltipPlacement,
  initialInputValue,
  onInputValueChange,
  availableInputTokens,
  availableOutputTokens,
  onInputTokenChange,
  onOutputTokenChange,
  showExchangeRate = false
}: SwapTabProps) => {
  const {
    formik,
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
    balance,
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

  // Determine isDefault values for input and output sections
  const inputSectionIsDefault =
    inputIsDefault !== undefined ? inputIsDefault : isDefault
  const outputSectionIsDefault =
    outputIsDefault !== undefined ? outputIsDefault : isDefault

  return (
    <FormikProvider value={formik}>
      <Form>
        <Flex direction='column'>
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
                isDefault={inputSectionIsDefault}
                error={error}
                errorMessage={errorMessage}
                tooltipPlacement={tooltipPlacement}
                availableTokens={
                  !inputSectionIsDefault ? availableInputTokens : undefined
                }
                onTokenChange={
                  !inputSectionIsDefault ? onInputTokenChange : undefined
                }
              />

              <TokenAmountSection
                title={messages.youReceive}
                tokenInfo={outputToken}
                isInput={false}
                amount={outputAmount}
                availableBalance={outputBalance?.get() || 0}
                exchangeRate={currentExchangeRate}
                tokenPrice={tokenPrice}
                isTokenPriceLoading={isTokenPriceLoading}
                tokenPriceDecimalPlaces={tokenPriceDecimalPlaces}
                tooltipPlacement={tooltipPlacement}
                isDefault={outputSectionIsDefault}
                availableTokens={
                  !outputSectionIsDefault ? availableOutputTokens : undefined
                }
                onTokenChange={
                  !outputSectionIsDefault ? onOutputTokenChange : undefined
                }
              />

              {/* Show exchange rate for convert flow */}
              {showExchangeRate && currentExchangeRate && (
                <Flex p='l' justifyContent='flex-start'>
                  <Text variant='body' size='s' color='subdued'>
                    {messages.exchangeRateLabel}&nbsp;
                  </Text>
                  <Text variant='body' size='s' color='default'>
                    {messages.exchangeRateValue(
                      inputToken.symbol,
                      outputToken.symbol,
                      currentExchangeRate
                    )}
                  </Text>
                </Flex>
              )}
            </>
          )}
        </Flex>
      </Form>
    </FormikProvider>
  )
}
