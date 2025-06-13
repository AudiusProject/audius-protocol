import React, { useMemo } from 'react'

import { exploreMessages as messages } from '@audius/common/messages'
import { ExploreCollectionsVariant } from '@audius/common/store'

import { Flex, Text } from '@audius/harmony-native'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'

import {
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND
} from '../collections'
import { REMIXABLES } from '../smartCollections'

import { ColorTile } from './ColorTile'

const tiles = [
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  PREMIUM_TRACKS,
  REMIXABLES
]

export const BestOfAudiusTiles = () => {
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()

  const filteredTiles = useMemo(
    () =>
      tiles.filter((tile) => {
        const isPremiumTracksTile =
          tile.variant === ExploreCollectionsVariant.DIRECT_LINK &&
          tile.title === PREMIUM_TRACKS.title
        return !isPremiumTracksTile || isUSDCPurchasesEnabled
      }),
    [isUSDCPurchasesEnabled]
  )

  return (
    <Flex gap='l'>
      <Text variant='title' size='l'>
        {messages.bestOfAudius}
      </Text>
      <Flex gap='s'>
        {filteredTiles.map((tile) => (
          <ColorTile
            style={{ flex: 1, flexBasis: '100%' }}
            key={tile.title}
            {...tile}
          />
        ))}
      </Flex>
    </Flex>
  )
}
