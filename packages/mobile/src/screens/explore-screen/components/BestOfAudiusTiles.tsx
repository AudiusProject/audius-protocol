import React, { useCallback, useMemo } from 'react'

import { exploreMessages as messages } from '@audius/common/messages'

import { Flex } from '@audius/harmony-native'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'

import {
  useSearchCategory,
  useSearchFilters
} from '../../search-screen/searchState'
import {
  PREMIUM_TRACKS,
  TRENDING_PLAYLISTS,
  TRENDING_UNDERGROUND
} from '../collections'

import { ColorTile } from './ColorTile'
import { ExploreSection } from './ExploreSection'

const tiles = [TRENDING_PLAYLISTS, TRENDING_UNDERGROUND, PREMIUM_TRACKS]

interface BestOfAudiusTilesProps {
  isLoading?: boolean
}

export const BestOfAudiusTiles = ({
  isLoading: externalLoading
}: BestOfAudiusTilesProps) => {
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const [, setCategory] = useSearchCategory()
  const [, setFilters] = useSearchFilters()

  const filteredTiles = useMemo(
    () =>
      tiles.filter((tile) => {
        const isPremiumTracksTile = tile.title === PREMIUM_TRACKS.title
        return !isPremiumTracksTile || isUSDCPurchasesEnabled
      }),
    [isUSDCPurchasesEnabled]
  )
  const handleTilePress = useCallback(
    (title) => {
      if (title === PREMIUM_TRACKS.title) {
        setCategory('tracks')
        setFilters({ isPremium: true })
      }
    },
    [setCategory, setFilters]
  )
  return (
    <ExploreSection title={messages.bestOfAudius} isLoading={externalLoading}>
      <Flex gap='s'>
        {filteredTiles.map((tile) => (
          <ColorTile
            style={{ flex: 1, flexBasis: '100%' }}
            key={tile.title}
            {...tile}
            onPress={() => handleTilePress(tile.title)}
          />
        ))}
      </Flex>
    </ExploreSection>
  )
}
