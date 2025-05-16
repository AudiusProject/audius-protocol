import {
  Button,
  Divider,
  Flex,
  IconInfo,
  Text,
  TextInput
} from '@audius/harmony'
import { useTheme } from '@emotion/react'

import { useTokenAmountFormatting } from './hooks'
import { TokenAmountSectionProps, TokenInfo } from './types'

const messages = {
  available: 'Available',
  max: 'MAX',
  amountInputLabel: (symbol: string) => `Amount (${symbol})`,
  tokenPrice: (price: string, decimalPlaces: number) => {
    const priceNum = parseFloat(price)
    const formattedPrice = priceNum.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimalPlaces
    })
    return `($${formattedPrice} ea.)`
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
        <IconInfo
          size='s'
          color='subdued'
          css={{ borderRadius: cornerRadius.circle }}
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
  const tokenTicker = messages.tokenTicker(symbol, !!isStablecoin)

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

  return (
    <Flex direction='column' gap='m'>
      <Flex alignItems='center' gap='m'>
        <Text variant='heading' size='s' color='subdued'>
          {title}
        </Text>
        <Divider css={{ flexGrow: 1 }} />
      </Flex>
      {isInput ? (
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
      ) : (
        <Flex p='l' alignItems='center' gap='s'>
          <TokenIcon
            width={spacing.unit16}
            height={spacing.unit16}
            css={{ borderRadius: cornerRadius.circle }}
          />
          <Flex direction='column'>
            <Text variant='heading' size='l'>
              {formattedAmount}
            </Text>
            <Flex gap='xs'>
              <Text variant='heading' size='s' color='subdued'>
                {tokenTicker}
              </Text>
              {priceDisplay && (
                <Text variant='heading' size='s' color='subdued'>
                  {priceDisplay}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
