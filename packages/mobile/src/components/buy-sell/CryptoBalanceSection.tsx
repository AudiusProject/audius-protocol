import { type TokenInfo } from '@audius/common/store'
import { Image } from 'react-native'

import { Flex, Text, useTheme, HexagonalIcon } from '@audius/harmony-native'

type CryptoBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  name?: string
  amount: string
  priceLabel?: string
}

export const CryptoBalanceSection = ({
  title,
  tokenInfo,
  name,
  amount,
  priceLabel
}: CryptoBalanceSectionProps) => {
  const { logoURI } = tokenInfo
  const { iconSizes, spacing } = useTheme()
  const iconSize = iconSizes['4xl']

  return (
    <Flex gap='m'>
      {/* Header */}
      <Text variant='heading' size='s' color='subdued'>
        {title}
      </Text>

      {/* Amount and token info */}
      <Flex row alignItems='center' gap='s'>
        <HexagonalIcon size={iconSize}>
          <Image
            source={{ uri: logoURI }}
            style={{ width: iconSize, height: iconSize }}
          />
        </HexagonalIcon>
        <Flex gap='xs'>
          {name && (
            <Text variant='heading' size='s'>
              {name}
            </Text>
          )}
          <Flex>
            <Flex row gap='xs' alignItems='center'>
              <Text variant='title' size='l'>
                {amount}
              </Text>
              <Text variant='title' size='l' color='subdued'>
                {tokenInfo.symbol}
              </Text>
            </Flex>
            <Flex row gap='xs'>
              {priceLabel && (
                <Text
                  variant='heading'
                  size='s'
                  color='subdued'
                  style={{
                    lineHeight: spacing.unit7,
                    transform: [{ translateY: -spacing.unitHalf }]
                  }}
                >
                  {priceLabel}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
