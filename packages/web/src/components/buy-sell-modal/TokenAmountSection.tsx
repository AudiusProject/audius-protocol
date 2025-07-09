import { useMemo } from 'react'

import { buySellMessages as messages } from '@audius/common/messages'
import { TokenAmountSectionProps, TokenInfo } from '@audius/common/store'
import { Button, Divider, Flex, Select, Text, TextInput } from '@audius/harmony'
import { useTheme } from '@emotion/react'
import { TooltipPlacement } from 'antd/lib/tooltip'

import { TooltipInfoIcon } from './TooltipInfoIcon'
import { useTokenAmountFormatting } from './hooks'

type BalanceSectionProps = {
  isStablecoin?: boolean
  formattedAvailableBalance: string | null
  tokenInfo: TokenInfo
  tooltipPlacement?: TooltipPlacement
}

const DefaultBalanceSection = ({
  isStablecoin,
  formattedAvailableBalance,
  tokenInfo,
  tooltipPlacement
}: BalanceSectionProps) => {
  const { cornerRadius } = useTheme()
  const { icon: TokenIcon } = tokenInfo

  if (!formattedAvailableBalance || !TokenIcon) {
    return null
  }

  return (
    <Flex
      direction='column'
      alignItems='flex-end'
      justifyContent='center'
      gap='xs'
      flex={1}
      alignSelf='stretch'
    >
      <Flex alignItems='center' gap='xs'>
        <TokenIcon size='l' css={{ borderRadius: cornerRadius.circle }} />
        <Text variant='heading' size='s' color='subdued'>
          {messages.available}
        </Text>
        <TooltipInfoIcon
          ariaLabel='Available balance'
          placement={tooltipPlacement}
        />
      </Flex>
      <Text variant='heading' size='xl'>
        {isStablecoin ? '$' : ''}
        {formattedAvailableBalance}
      </Text>
    </Flex>
  )
}

const StackedBalanceSection = ({
  formattedAvailableBalance,
  tokenInfo,
  isStablecoin
}: BalanceSectionProps) => {
  const { cornerRadius } = useTheme()
  const { icon: TokenIcon, symbol } = tokenInfo

  if (!formattedAvailableBalance || !TokenIcon) {
    return null
  }

  return (
    <Flex
      direction='column'
      alignItems='flex-end'
      justifyContent='center'
      gap='xs'
      flex={1}
      alignSelf='stretch'
    >
      <Flex gap='s' alignItems='center'>
        <Flex direction='column'>
          <Flex alignSelf='flex-end'>
            <Text variant='heading' size='s' color='subdued'>
              {messages.tokenTicker(symbol, !!isStablecoin)}
            </Text>
          </Flex>
          <Text variant='title' size='s' color='default'>
            {messages.stackedBalance(formattedAvailableBalance)}
          </Text>
        </Flex>
        {/* We need the border radius to be circle here because the AUDIO icon is a square image */}
        <TokenIcon size='4xl' css={{ borderRadius: cornerRadius.circle }} />
      </Flex>
    </Flex>
  )
}

const CryptoAmountSection = ({
  formattedAmount,
  tokenInfo,
  isStablecoin,
  priceDisplay
}: {
  formattedAmount: string
  tokenInfo: TokenInfo
  isStablecoin: boolean
  priceDisplay?: string
}) => {
  const { spacing, cornerRadius } = useTheme()
  const { icon: TokenIcon, symbol } = tokenInfo
  const tokenTicker = messages.tokenTicker(symbol, !!isStablecoin)

  if (!TokenIcon) {
    return null
  }

  return (
    <Flex p='l' alignItems='center' gap='s'>
      <TokenIcon
        width={spacing.unit16}
        height={spacing.unit16}
        css={{ borderRadius: cornerRadius.circle }}
      />
      <Flex direction='column'>
        <Flex gap='xs' justifyContent='center' alignItems='center'>
          <Text variant='heading' size='l'>
            {formattedAmount}
          </Text>
          <Text variant='heading' size='l' color='subdued'>
            {tokenTicker}
          </Text>
        </Flex>
        {priceDisplay && (
          <Text variant='heading' size='s' color='subdued'>
            {priceDisplay}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

export const TokenAmountSection = ({
  title,
  tokenInfo,
  isInput,
  amount,
  onAmountChange,
  onMaxClick,
  availableBalance,
  exchangeRate,
  placeholder = '0.00',
  isDefault = true,
  error,
  errorMessage,
  tokenPrice,
  isTokenPriceLoading,
  tokenPriceDecimalPlaces = 2,
  tooltipPlacement,
  availableTokens,
  onTokenChange
}: TokenAmountSectionProps & {
  availableTokens?: TokenInfo[]
  onTokenChange?: (symbol: string) => void
}) => {
  const { spacing } = useTheme()

  const { icon: TokenIcon, symbol, isStablecoin } = tokenInfo

  const { formattedAvailableBalance, formattedAmount } =
    useTokenAmountFormatting({
      amount,
      availableBalance,
      exchangeRate,
      isStablecoin: !!isStablecoin,
      placeholder
    })

  const priceDisplay =
    tokenPrice && !isTokenPriceLoading
      ? messages.tokenPrice(tokenPrice, tokenPriceDecimalPlaces)
      : null

  const youPaySection = useMemo(() => {
    const showTokenSelector =
      availableTokens && availableTokens.length > 1 && onTokenChange

    return (
      <Flex gap='s' p='l' alignItems='flex-start'>
        <Flex direction='column' gap='xs' alignItems='flex-start' flex={1}>
          <Flex alignItems='flex-start' gap='s' w='100%'>
            {showTokenSelector ? (
              <Flex direction='column' gap='xs' flex={1}>
                <Flex gap='s' w='100%'>
                  <TextInput
                    label={messages.amountInputLabel(symbol)}
                    placeholder={placeholder}
                    value={amount?.toString() || ''}
                    onChange={(e) => onAmountChange?.(e.target.value)}
                    error={error}
                    css={{ flex: 1 }}
                  />
                  <Select
                    label=''
                    value={symbol}
                    onChange={onTokenChange}
                    options={availableTokens.map((token) => ({
                      value: token.symbol,
                      label: token.symbol,
                      icon: token.icon
                    }))}
                    css={{ minWidth: spacing.unit20 }}
                  />
                </Flex>
              </Flex>
            ) : (
              <TextInput
                label={messages.amountInputLabel(symbol)}
                placeholder={placeholder}
                value={amount?.toString() || ''}
                onChange={(e) => onAmountChange?.(e.target.value)}
                error={error}
              />
            )}
            <Button
              variant='secondary'
              css={{
                height: spacing.unit16
              }}
              onClick={onMaxClick}
            >
              {messages.max}
            </Button>
          </Flex>
          {isInput && !!errorMessage ? (
            <Text size='xs' variant='body' color='danger'>
              {errorMessage}
            </Text>
          ) : null}
        </Flex>
        {isDefault ? (
          <DefaultBalanceSection
            isStablecoin={!!isStablecoin}
            formattedAvailableBalance={formattedAvailableBalance}
            tokenInfo={tokenInfo}
            tooltipPlacement={tooltipPlacement}
          />
        ) : (
          <StackedBalanceSection
            formattedAvailableBalance={formattedAvailableBalance}
            tokenInfo={tokenInfo}
          />
        )}
      </Flex>
    )
  }, [
    amount,
    error,
    errorMessage,
    formattedAvailableBalance,
    isDefault,
    isInput,
    isStablecoin,
    onAmountChange,
    onMaxClick,
    placeholder,
    spacing,
    symbol,
    tokenInfo,
    tooltipPlacement,
    availableTokens,
    onTokenChange
  ])

  const youReceiveSection = useMemo(() => {
    const showTokenSelector =
      availableTokens && availableTokens.length > 1 && onTokenChange

    if (!formattedAmount && !showTokenSelector) {
      return null
    }

    if (showTokenSelector) {
      return (
        <Flex direction='column' gap='s' p='l'>
          <Flex alignItems='center' gap='s'>
            <Select
              label=''
              value={symbol}
              onChange={onTokenChange}
              options={availableTokens.map((token) => ({
                value: token.symbol,
                label: token.symbol,
                icon: token.icon
              }))}
              css={{ minWidth: spacing.unit20 }}
            />
          </Flex>
          {formattedAmount && (
            <CryptoAmountSection
              formattedAmount={formattedAmount}
              tokenInfo={tokenInfo}
              isStablecoin={!!isStablecoin}
              priceDisplay={priceDisplay || undefined}
            />
          )}
        </Flex>
      )
    }

    if (isStablecoin) {
      return (
        <Text variant='display' size='s'>
          {messages.tokenPrice(formattedAmount || '0', 2)}
        </Text>
      )
    }

    return (
      <CryptoAmountSection
        formattedAmount={formattedAmount || '0'}
        tokenInfo={tokenInfo}
        isStablecoin={!!isStablecoin}
        priceDisplay={priceDisplay || undefined}
      />
    )
  }, [
    formattedAmount,
    isStablecoin,
    priceDisplay,
    tokenInfo,
    availableTokens,
    onTokenChange,
    symbol,
    spacing.unit20
  ])

  const titleText = useMemo(() => {
    if (isStablecoin && !isInput && TokenIcon) {
      return (
        <Flex alignItems='center' gap='s'>
          <TokenIcon size='l' />
          <Text variant='heading' size='s' color='subdued'>
            {title}
          </Text>
          <TooltipInfoIcon
            ariaLabel='You receive'
            placement={tooltipPlacement}
          />
        </Flex>
      )
    }
    return (
      <Text variant='heading' size='s' color='subdued'>
        {title}
      </Text>
    )
  }, [TokenIcon, isInput, isStablecoin, title, tooltipPlacement])

  return (
    <Flex direction='column' gap='m'>
      <Flex alignItems='center' justifyContent='center' gap='m'>
        {titleText}
        <Divider css={{ flexGrow: 1 }} />
      </Flex>
      {isInput ? youPaySection : youReceiveSection}
    </Flex>
  )
}
