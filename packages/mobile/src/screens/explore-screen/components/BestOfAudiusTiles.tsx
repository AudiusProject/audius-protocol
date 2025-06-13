import React, { useMemo } from 'react'

import { exploreMessages as messages } from '@audius/common/messages'
import { ExploreCollectionsVariant } from '@audius/common/store'

import { Flex } from '@audius/harmony-native'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'

import {
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND
} from '../collections'
import { REMIXABLES } from '../smartCollections'

import { ColorTile } from './ColorTile'
import { ExploreSection } from './ExploreSection'

const tiles = [
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND,
  PREMIUM_TRACKS,
  REMIXABLES
]

interface BestOfAudiusTilesProps {
  isLoading?: boolean
}

export const BestOfAudiusTiles = ({
  isLoading: externalLoading
}: BestOfAudiusTilesProps) => {
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
    <ExploreSection title={messages.bestOfAudius} isLoading={externalLoading}>
      <Flex gap='s'>
        {filteredTiles.map((tile) => (
          <ColorTile
            style={{ flex: 1, flexBasis: '100%' }}
            key={tile.title}
            {...tile}
          />
        ))}
      </Flex>
    </ExploreSection>
  )
}
