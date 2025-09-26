import React, { useCallback } from 'react'

import {
  useCurrentUserId,
  useQueryContext,
  useUserCoins
} from '@audius/common/api'
import { useFeatureFlag, useIsManagedAccount } from '@audius/common/hooks'
import { buySellMessages, walletMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import { useBuySellModal } from '@audius/common/store'
import { ownedCoinsFilter } from '@audius/common/utils'
import { TouchableOpacity } from 'react-native'

import { Box, Button, Divider, Flex, Paper, Text } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { CoinCard, CoinCardSkeleton, HexagonalSkeleton } from './CoinCard'

const messages = {
  ...buySellMessages,
  managedAccount: "You can't do that as a managed user"
}

const YourCoinsSkeleton = () => {
  return (
    <Flex p='l' pl='xl' row justifyContent='space-between' alignItems='center'>
      <Flex row alignItems='center' gap='l'>
        <HexagonalSkeleton />
        <CoinCardSkeleton />
      </Flex>
    </Flex>
  )
}

const YourCoinsHeader = ({ isLoading }: { isLoading: boolean }) => {
  const { onOpen: openBuySellModal } = useBuySellModal()
  const isManagedAccount = useIsManagedAccount()

  const handleBuySellClick = useCallback(() => {
    if (isManagedAccount) {
      // TODO: Add toast for mobile
    } else {
      openBuySellModal()
    }
  }, [isManagedAccount, openBuySellModal])

  return (
    <Flex
      row
      alignItems='center'
      justifyContent='space-between'
      p='l'
      pb='s'
      borderBottom='default'
    >
      <Text variant='heading' size='s' color='heading'>
        {messages.coins}
      </Text>
      <Button variant='secondary' size='small' onPress={handleBuySellClick}>
        {messages.buySell}
      </Button>
    </Flex>
  )
}

const DiscoverArtistCoinsCard = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Flex
        p='l'
        pl='xl'
        row
        h={96}
        justifyContent='space-between'
        alignItems='center'
      >
        <Text variant='heading' size='s' numberOfLines={1}>
          {walletMessages.artistCoins.title}
        </Text>
      </Flex>
    </TouchableOpacity>
  )
}

export const YourCoins = () => {
  const { data: currentUserId } = useCurrentUserId()
  const navigation = useNavigation()
  const { env } = useQueryContext()
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const { data: artistCoins, isPending: isLoadingCoins } = useUserCoins({
    userId: currentUserId
  })

  const filteredCoins =
    artistCoins?.filter(
      ownedCoinsFilter(!!isArtistCoinsEnabled, env.WAUDIO_MINT_ADDRESS)
    ) ?? []

  // Show audio coin card when no coins are available
  const showAudioCoin = filteredCoins.length === 0
  const baseCards = showAudioCoin ? ['audio-coin' as const] : filteredCoins

  // Add discover artist coins card at the end if feature is enabled
  const cards = isArtistCoinsEnabled
    ? [...baseCards, 'discover-artist-coins' as const]
    : baseCards

  const handleDiscoverArtistCoins = useCallback(() => {
    navigation.navigate('ArtistCoinsExplore')
  }, [navigation])

  return (
    <Paper>
      <YourCoinsHeader isLoading={isLoadingCoins} />
      <Flex column>
        {isLoadingCoins || !currentUserId ? (
          <YourCoinsSkeleton />
        ) : (
          cards.map((item) => (
            <Box key={typeof item === 'string' ? item : item.mint}>
              {item === 'discover-artist-coins' ? (
                <DiscoverArtistCoinsCard onPress={handleDiscoverArtistCoins} />
              ) : item === 'audio-coin' ? (
                <CoinCard mint={env.WAUDIO_MINT_ADDRESS} />
              ) : (
                <CoinCard mint={item.mint} />
              )}
              <Divider />
            </Box>
          ))
        )}
      </Flex>
    </Paper>
  )
}
