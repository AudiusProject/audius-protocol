import { TokenInfo } from '@audius/common/store'
import { Divider, Flex, Text } from '@audius/harmony'

import { TokenIcon } from './TokenIcon'

const messages = {
  symbol: (symbol: string) => `${symbol}`
}

type CryptoBalanceSectionProps = {
  title?: string
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
  return (
    <Flex direction='column' gap='l'>
      {title ? (
        <Flex alignItems='center' gap='m'>
          <Text variant='heading' size='s' color='subdued'>
            {title}
          </Text>
          <Divider css={{ flexGrow: 1 }} />
        </Flex>
      ) : null}
      <Flex alignItems='center' gap='s' data-testid='token-icon'>
        <TokenIcon
          logoURI={tokenInfo.logoURI}
          icon={tokenInfo.icon}
          w='unit16'
          h='unit16'
          hex
        />
        <Flex direction='column'>
          <Text variant='heading' size='l'>
            {amount}
          </Text>
          <Flex gap='xs'>
            <Text variant='heading' size='s' color='subdued'>
              {messages.symbol(tokenInfo.symbol)}
            </Text>
            {priceLabel ? (
              <Text variant='heading' size='s' color='subdued'>
                {priceLabel}
              </Text>
            ) : null}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
