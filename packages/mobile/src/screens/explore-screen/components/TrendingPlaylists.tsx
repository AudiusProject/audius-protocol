import React from 'react'

import { useTrendingPlaylists } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { trendingPlaylistsPageLineupActions } from '@audius/common/store'

import { CollectionLineupCarousel } from './CollectionLineupCarousel'
import { ExploreSection } from './ExploreSection'

export const TrendingPlaylists = () => {
  const { lineup, isLoading } = useTrendingPlaylists()

  return (
    <ExploreSection
      title={messages.trendingPlaylists}
      isLoading={isLoading}
      viewAllLink='TrendingPlaylists'
    >
      <CollectionLineupCarousel
        lineup={lineup}
        isTrending
        actions={trendingPlaylistsPageLineupActions}
      />
    </ExploreSection>
  )
}
