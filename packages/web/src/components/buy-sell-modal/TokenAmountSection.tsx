import { useMemo } from 'react'

import { TokenInfo, TokenAmountSectionProps } from '@audius/common/store'
import { USDC } from '@audius/fixed-decimal'
import {
  Button,
  Divider,
  Flex,
  IconButton,
  IconInfo,
  Text,
  TextInput
} from '@audius/harmony'
import { useTheme } from '@emotion/react'

import { useTokenAmountFormatting } from './hooks'

const messages = {
  available: 'Available',
  max: 'MAX',
  amountInputLabel: (symbol: string) => `Amount (${symbol})`,
  tokenPrice: (price: string, decimalPlaces: number) => {
    return USDC(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimalPlaces
    })
  },
  stackedBalance: (formattedAvailableBalance: string) =>
    `${formattedAvailableBalance}  Available`,
  tokenTicker: (symbol: string, isStablecoin: boolean) =>
    isStablecoin ? symbol : `$${symbol}`
}

type BalanceSectionProps = {
  isStablecoin?: boolean
  formattedAvailableBalance: string
  tokenInfo: TokenInfo
}

const DefaultBalanceSection = ({
  isStablecoin,
  formattedAvailableBalance,
  tokenInfo
}: BalanceSectionProps) => {
  const { cornerRadius } = useTheme()
  const { icon: TokenIcon } = tokenInfo
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
        <IconButton
          size='s'
          color='subdued'
          css={{ borderRadius: cornerRadius.circle }}
          icon={IconInfo}
          aria-label='Available balance'
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
  tokenPriceDecimalPlaces = 2
}: TokenAmountSectionProps) => {
  const { spacing, cornerRadius } = useTheme()

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
      : undefined

  const youPaySection = useMemo(() => {
    return (
      <Flex gap='s' p='l' alignItems='flex-start'>
        <Flex direction='column' gap='xs' alignItems='flex-start'>
          <Flex alignItems='flex-start' gap='s'>
            <TextInput
              label={messages.amountInputLabel(symbol)}
              placeholder={placeholder}
              value={amount?.toString() || ''}
              onChange={(e) => onAmountChange?.(e.target.value)}
              error={error}
            />
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
    spacing.unit16,
    symbol,
    tokenInfo
  ])

  const youReceiveSection = useMemo(() => {
    if (isStablecoin) {
      return (
        <Text variant='display' size='s'>
          {messages.tokenPrice(formattedAmount, 2)}
        </Text>
      )
    }

    return (
      <CryptoAmountSection
        formattedAmount={formattedAmount}
        tokenInfo={tokenInfo}
        isStablecoin={!!isStablecoin}
        priceDisplay={priceDisplay}
      />
    )
  }, [formattedAmount, isStablecoin, priceDisplay, tokenInfo])

  const titleText = useMemo(() => {
    if (isStablecoin && !isInput) {
      return (
        <Flex alignItems='center' gap='s'>
          <TokenIcon size='l' />
          <Text variant='heading' size='s' color='subdued'>
            {title}
          </Text>
          <IconButton
            size='s'
            color='subdued'
            css={{ borderRadius: cornerRadius.circle }}
            icon={IconInfo}
            aria-label='You receive'
          />
        </Flex>
      )
    }
    return (
      <Text variant='heading' size='s' color='subdued'>
        {title}
      </Text>
    )
  }, [TokenIcon, cornerRadius.circle, isInput, isStablecoin, title])

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
