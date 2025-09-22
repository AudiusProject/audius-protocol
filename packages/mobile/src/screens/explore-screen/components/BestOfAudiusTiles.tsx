import React, { useCallback, useMemo } from 'react'

import { exploreMessages as messages } from '@audius/common/messages'

import { Box, Flex } from '@audius/harmony-native'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { useNavigation } from 'app/hooks/useNavigation'

import { useDeferredElement } from '../../../hooks/useDeferredElement'
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

export const BestOfAudiusTiles = () => {
  const { InViewWrapper, inView } = useDeferredElement()
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const [, setCategory] = useSearchCategory()
  const [, setFilters] = useSearchFilters()
  const { navigate } = useNavigation()
  const filteredTiles = useMemo(
    () =>
      tiles.filter((tile) => {
        const isPremiumTracksTile = tile.title === PREMIUM_TRACKS.title
        return !isPremiumTracksTile || isUSDCPurchasesEnabled
      }),
    [isUSDCPurchasesEnabled]
  )
  const handleTilePress = useCallback(
    (title: string) => {
      if (title === PREMIUM_TRACKS.title) {
        setCategory('tracks')
        setFilters({ isPremium: true })
      } else if (title === TRENDING_PLAYLISTS.title) {
        navigate('TrendingPlaylists')
      } else if (title === TRENDING_UNDERGROUND.title) {
        navigate('TrendingUnderground')
      }
    },
    [navigate, setCategory, setFilters]
  )
  return (
    <InViewWrapper>
      <ExploreSection title={messages.bestOfAudius}>
        <Flex gap='s'>
          {inView ? (
            filteredTiles.map((tile) => (
              <ColorTile
                style={{ flex: 1, flexBasis: '100%' }}
                key={tile.title}
                {...tile}
                onPress={() => handleTilePress(tile.title)}
              />
            ))
          ) : (
            <Box h={300} />
          )}
        </Flex>
      </ExploreSection>
    </InViewWrapper>
  )
}
