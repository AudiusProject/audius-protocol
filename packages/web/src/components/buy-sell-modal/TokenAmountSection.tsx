import { getCurrencyDecimalPlaces } from '@audius/common/utils'
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
import { TokenAmountSectionProps } from './types'

const messages = {
  available: 'Available',
  max: 'MAX',
  amountInputLabel: (symbol: string) => `Amount (${symbol})`,
  exchangeRate: (rate: number, isTokenStablecoin: boolean) => {
    const decimalPlaces = isTokenStablecoin ? 2 : getCurrencyDecimalPlaces(rate)
    const formattedRateStr = rate.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimalPlaces
    })
    return `(${isTokenStablecoin ? '$' : ''}${formattedRateStr} ea.)`
  }
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
  placeholder = '0.00'
}: TokenAmountSectionProps) => {
  const { spacing } = useTheme()

  const { icon: TokenIcon, symbol, isStablecoin } = tokenInfo
  const tokenTicker = isStablecoin ? symbol : `$${symbol}`

  const { formattedAvailableBalance, formattedAmount } =
    useTokenAmountFormatting({
      amount,
      availableBalance,
      exchangeRate,
      isStablecoin: !!isStablecoin,
      placeholder
    })

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
          <Flex alignItems='flex-start' gap='s'>
            <TextInput
              label={messages.amountInputLabel(symbol)}
              placeholder={placeholder}
              value={amount?.toString() || ''}
              onChange={(e) => onAmountChange?.(e.target.value)}
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
          <Flex
            direction='column'
            alignItems='flex-end'
            justifyContent='center'
            gap='xs'
            css={{ flexGrow: 1, alignSelf: 'stretch' }}
          >
            <Flex alignItems='center' gap='s'>
              <TokenIcon size='l' />
              <Text variant='heading' size='s' color='subdued'>
                {messages.available}
              </Text>
              <IconInfo size='s' color='subdued' />
            </Flex>
            <Text variant='heading' size='xl'>
              {isStablecoin ? '$' : ''}
              {formattedAvailableBalance}
            </Text>
          </Flex>
        </Flex>
      ) : (
        <Flex p='l' alignItems='center' gap='s'>
          <TokenIcon width={spacing.unit16} height={spacing.unit16} />
          <Flex direction='column'>
            <Text variant='heading' size='l'>
              {formattedAmount}
            </Text>
            <Flex gap='xs'>
              <Text variant='heading' size='s' color='subdued'>
                {tokenTicker}
              </Text>
              {exchangeRate !== null && exchangeRate !== undefined && (
                <Text variant='heading' size='s' color='subdued'>
                  {messages.exchangeRate(exchangeRate, !!isStablecoin)}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
