import { useCallback } from 'react'

import { useArtistCoin } from '@audius/common/api'
import { useFeatureFlag, useFormattedTokenBalance } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { Image, TouchableOpacity } from 'react-native'

import { Flex, HexagonalIcon, Skeleton, Text } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

// TODO: Fix loading states
// Skeletons are not working as expected

const ICON_SIZE = 64

const CoinCardSkeleton = () => {
  return (
    <Flex column gap='xs'>
      <Skeleton w='240px' h='36px' />
      <Skeleton w='140px' h='24px' />
    </Flex>
  )
}

const IconSkeleteon = () => {
  return <Skeleton w={ICON_SIZE} h={ICON_SIZE} />
}

export type CoinCardProps = {
  mint: string
  showUserBalance?: boolean
}

export const CoinCard = ({ mint, showUserBalance = true }: CoinCardProps) => {
  const navigation = useNavigation()

  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const { data: coinData, isPending: coinsDataLoading } = useArtistCoin(mint)

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
        <Flex row alignItems='center' gap='l'>
          {isLoading ? <IconSkeleteon /> : renderIcon()}
          <Flex column gap='xs'>
            {isLoading ? (
              <CoinCardSkeleton />
            ) : (
              <>
                <Text variant='heading' size='s'>
                  {coinData?.name}
                </Text>
                <Flex row alignItems='center' gap='xs'>
                  <Text variant='title' size='l'>
                    {balance}
                  </Text>
                  <Text variant='title' size='l' color='subdued'>
                    {coinData?.ticker}
                  </Text>
                </Flex>
              </>
            )}
          </Flex>
        </Flex>
        <Flex row alignItems='center' gap='m'>
          {!isLoading && showUserBalance ? (
            <Text variant='title' size='l' color='default'>
              {dollarValue}
            </Text>
          ) : null}
        </Flex>
      </Flex>
    </TouchableOpacity>
  )
}
