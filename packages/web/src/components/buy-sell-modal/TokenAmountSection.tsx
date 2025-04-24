import {
  Button,
  Divider,
  Flex,
  IconInfo,
  Text,
  TextInput
} from '@audius/harmony'
import { useTheme } from '@emotion/react'

import { TokenAmountSectionProps } from './types'

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
              label={`Amount (${symbol})`}
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
              MAX
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
                Available
              </Text>
              <IconInfo size='s' color='subdued' />
            </Flex>
            <Text variant='heading' size='xl'>
              {isStablecoin ? '$' : ''}
              {availableBalance.toFixed(2)}
            </Text>
          </Flex>
        </Flex>
      ) : (
        <Flex p='l' alignItems='center' gap='s'>
          <TokenIcon width={spacing.unit16} height={spacing.unit16} />
          <Flex direction='column'>
            <Text variant='heading' size='l'>
              {amount}
            </Text>
            <Flex gap='xs'>
              <Text variant='heading' size='s' color='subdued'>
                {tokenTicker}
              </Text>
              {exchangeRate !== null && exchangeRate !== undefined && (
                <Text variant='heading' size='s' color='subdued'>
                  ({isStablecoin ? '$' : ''}
                  {exchangeRate})
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
