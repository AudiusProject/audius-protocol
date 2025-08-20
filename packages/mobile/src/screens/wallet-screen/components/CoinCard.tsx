import { useCallback } from 'react'

import { useArtistCoins } from '@audius/common/api'
import { useFeatureFlag, useFormattedTokenBalance } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { Image, TouchableOpacity } from 'react-native'

import {
  Flex,
  HexagonalIcon,
  IconCaretRight,
  Skeleton,
  Text
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

// TODO: Fix loading states
// Skeletons are not working as expected

const CoinCardSkeleton = () => {
  return (
    <Flex column h='2xl' w='100%' gap='xs'>
      <Text>Test Ticker Name</Text>
      <Skeleton w='100px' h='24px' />
    </Flex>
  )
}

const HexagonSkeleton = () => {
  return (
    <Skeleton
      w='64px'
      h='64px'
      style={{
        // TODO: Figure out how to use the clip path
        // clipPath: `url(#${roundedHexClipPath})`
        borderRadius: '100%'
      }}
    />
  )
}

export type CoinCardProps = {
  mint: string
  showUserBalance?: boolean
}

export const CoinCard = ({ mint, showUserBalance = true }: CoinCardProps) => {
  const navigation = useNavigation()
  const ICON_SIZE = showUserBalance ? 64 : 40
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const { data: coinsData, isPending: coinsDataLoading } = useArtistCoins({
    mint: [mint]
  })

  const coinData = coinsData?.[0] ?? null
  const icon = coinData?.logoUri ?? ''

  const onPress = useCallback(() => {
    if (isArtistCoinsEnabled) {
      navigation.navigate('CoinDetailsScreen', { mint })
    } else {
      navigation.navigate('AudioScreen')
    }
  }, [mint, navigation, isArtistCoinsEnabled])

  const {
    tokenBalanceFormatted: balance,
    tokenDollarValue: dollarValue,
    isTokenBalanceLoading,
    isTokenPriceLoading
  } = useFormattedTokenBalance(mint)

  const isLoading =
    isTokenBalanceLoading || isTokenPriceLoading || coinsDataLoading

  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <HexagonalIcon size={ICON_SIZE}>
          <Image
            source={{ uri: icon }}
            style={{
              width: ICON_SIZE,
              height: ICON_SIZE
            }}
          />
        </HexagonalIcon>
      )
    }
    return icon
  }

  return (
    <TouchableOpacity onPress={onPress}>
      <Flex
        p='l'
        pl='xl'
        row
        justifyContent='space-between'
        alignItems='center'
      >
        <Flex row alignItems='center' gap='m'>
          {isLoading ? <HexagonSkeleton /> : renderIcon()}
          <Flex column gap='xs' h='3xl' justifyContent='center'>
            {isLoading ? (
              <CoinCardSkeleton />
            ) : (
              <>
                <Flex row alignItems='center' h='2xl' gap='xs'>
                  {showUserBalance ? (
                    <Text variant='heading' size='l'>
                      {balance}
                    </Text>
                  ) : null}
                  <Text
                    variant='heading'
                    size={showUserBalance ? 'l' : 'm'}
                    color={showUserBalance ? 'subdued' : 'default'}
                  >
                    {coinData?.ticker}
                  </Text>
                  {/* TODO: Add coin value for AllCoinsScreen */}
                  {/* {!showUserBalance ? (
                    <Text variant='heading' size='m' color='subdued'>
                      (Coin Value)
                    </Text>
                  ) : null} */}
                </Flex>
                {showUserBalance ? (
                  <Text variant='heading' size='s' color='subdued'>
                    {dollarValue}
                  </Text>
                ) : null}
              </>
            )}
          </Flex>
        </Flex>
        <IconCaretRight size='l' color='subdued' />
      </Flex>
    </TouchableOpacity>
  )
}
