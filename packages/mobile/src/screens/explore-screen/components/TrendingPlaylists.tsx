import React, { useMemo } from 'react'

import { useTrendingPlaylists } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'

import { CollectionTileCarousel } from './CollectionTileCarousel'
import { ExploreSection } from './ExploreSection'

export const TrendingPlaylists = () => {
  const { data: trendingPlaylists, isLoading } = useTrendingPlaylists()

  const playlistIds = useMemo(() => {
    return trendingPlaylists.map(({ id }) => id)
  }, [trendingPlaylists])

  return (
    <ExploreSection title={messages.trendingPlaylists} isLoading={isLoading}>
      <CollectionTileCarousel collectionIds={playlistIds} isTrending />
    </ExploreSection>
  )
}
