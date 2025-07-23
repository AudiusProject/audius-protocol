import { TokenInfo } from '@audius/common/store'
import { Divider, Flex, Text } from '@audius/harmony'
import { useTheme } from '@emotion/react'

const messages = {
  symbol: (symbol: string) => `$${symbol}`
}

type CryptoBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
  priceLabel?: string
}

export const CryptoBalanceSection = ({
  title,
  tokenInfo,
  amount,
  priceLabel
}: CryptoBalanceSectionProps) => {
  const { spacing } = useTheme()
  const { icon: TokenIcon } = tokenInfo

  return (
    <Flex direction='column' gap='l'>
      <Flex alignItems='center' gap='m'>
        <Text variant='heading' size='s' color='subdued'>
          {title}
        </Text>
        <Divider css={{ flexGrow: 1 }} />
      </Flex>
      <Flex alignItems='center' gap='s' data-testid='token-icon'>
        {TokenIcon ? (
          <TokenIcon width={spacing.unit16} height={spacing.unit16} hex />
        ) : null}
        <Flex direction='column'>
          <Text variant='heading' size='l'>
            {amount}
          </Text>
          <Flex gap='xs'>
            <Text variant='heading' size='s' color='subdued'>
              {messages.symbol(tokenInfo.symbol)}
            </Text>
            {priceLabel && (
              <Text variant='heading' size='s' color='subdued'>
                {priceLabel}
              </Text>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
